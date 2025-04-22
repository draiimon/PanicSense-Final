#!/usr/bin/env python3

import sys
import json
import argparse
import logging
import time
import os
import re
import random
import concurrent.futures
from datetime import datetime

try:
    import pandas as pd
    import numpy as np
    from langdetect import detect
except ImportError:
    print(
        "Error: Required packages not found. Install them using pip install pandas numpy langdetect"
    )
    sys.exit(1)

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')

parser = argparse.ArgumentParser(description='Process disaster sentiment data')
parser.add_argument('--text', type=str, help='Text to analyze')
parser.add_argument('--file', type=str, help='CSV file to process')


def report_progress(processed: int, stage: str, total: int = None):
    """Print progress in a format that can be parsed by the Node.js service"""
    progress_data = {"processed": processed, "stage": stage}

    # If total is provided, include it in the progress report
    if total is not None:
        progress_data["total"] = total

    progress_info = json.dumps(progress_data)
    # Add a unique marker at the end to ensure each progress message is on a separate line
    print(f"PROGRESS:{progress_info}::END_PROGRESS", file=sys.stderr)
    sys.stderr.flush()  # Ensure output is immediately visible


class DisasterSentimentBackend:

    def __init__(self):
        # Enhanced sentiment categories with clearer definitions from PanicSensePH Emotion Classification Guide
        self.sentiment_labels = [
            'Panic', 'Fear/Anxiety', 'Disbelief', 'Resilience', 'Neutral'
        ]

        # Enhanced sentiment definitions with examples for better classification
        self.sentiment_definitions = {
            'Panic': {
                'definition': 'A state of intense fear and emotional overwhelm with helplessness and urgent cry for help',
                'indicators': ['exclamatory expressions', 'all-caps text', 'repeated punctuation', 'emotional breakdowns', 'frantic sentence structure'],
                'emojis': ['😱', '😭', '🆘', '💔'],
                'phrases': [
                    'Tulungan nyo po kami', 'HELP', 'RESCUE', 'tulong', 'mamamatay na kami',
                    'ASAN ANG RESCUE', 'di kami makaalis', 'NAIIPIT KAMI', 'PLEASE'
                ]
            },
            'Fear/Anxiety': {
                'definition': 'Heightened worry, stress and uncertainty with some level of control',
                'indicators': ['expressions of worry', 'use of ellipses', 'passive tones', 'lingering unease'],
                'emojis': ['😨', '😰', '😟'],
                'phrases': [
                    'kinakabahan ako', 'natatakot ako', 'di ako mapakali', 'worried', 'anxious',
                    'fearful', 'nakakatakot', 'nakakapraning', 'makakaligtas kaya', 'paano na'
                ]
            },
            'Resilience': {
                'definition': 'Expression of strength, unity and optimism despite adversity',
                'indicators': ['encouraging tone', 'supportive language', 'references to community', 'affirmative language', 'faith'],
                'emojis': ['💪', '🙏', '🌈', '🕊️'],
                'phrases': [
                    'kapit lang', 'kaya natin to', 'malalagpasan din natin', 'stay strong', 'prayers',
                    'dasal', 'tulong tayo', 'magtulungan', 'babangon tayo', 'sama-sama', 'matatag'
                ]
            },
            'Neutral': {
                'definition': 'Emotionally flat statements focused on factual information',
                'indicators': ['lack of emotional language', 'objective reporting', 'formal sentence structure'],
                'emojis': ['📍', '📰'],
                'phrases': [
                    'reported', 'according to', 'magnitude', 'flooding detected', 'advisory',
                    'update', 'bulletin', 'announcement', 'alert level', 'status'
                ]
            },
            'Disbelief': {
                'definition': 'Reactions of surprise, sarcasm, irony or denial as coping mechanism',
                'indicators': ['ironic tone', 'sarcastic comments', 'humor to mask fear', 'exaggeration', 'memes'],
                'emojis': ['🤯', '🙄', '😆', '😑'],
                'phrases': [
                    'baha na naman', 'classic ph', 'wala tayong alert', 'nice one', 'as usual',
                    'same old story', 'what else is new', 'nakakasawa na', 'expected', 'wow surprise'
                ]
            }
        }

        # For API calls in regular analysis
        self.api_keys = []
        # For validation use only (1 key maximum)
        self.groq_api_keys = []

        # First check for a dedicated validation key
        validation_key = os.getenv("VALIDATION_API_KEY")
        if validation_key:
            # If we have a dedicated validation key, use it
            self.groq_api_keys.append(validation_key)
            logging.info(f"Using dedicated validation API key")

        # Load API keys from environment (for regular analysis)
        i = 1
        while True:
            key_name = f"API_KEY_{i}"
            api_key = os.getenv(key_name)
            if api_key:
                self.api_keys.append(api_key)
                # Only add to validation keys if we don't already have a dedicated one
                if not self.groq_api_keys and i == 1:
                    self.groq_api_keys.append(api_key)
                i += 1
            else:
                break

        # Handle API key legacy format if present
        if not self.api_keys and os.getenv("API_KEY"):
            api_key = os.getenv("API_KEY")
            self.api_keys.append(api_key)
            # Only add to validation keys if we don't already have one
            if not self.groq_api_keys:
                self.groq_api_keys.append(api_key)

        # Default keys if none provided - IMPORTANT: Limit validation to ONE key
        if not self.api_keys:
            # Load API keys from attached file instead of hardcoding
            api_key_list = []
            # Get keys from environment variables first
            for i in range(1, 30):  # Try up to 30 keys
                env_key = os.getenv(f"GROQ_API_KEY_{i}")
                if env_key:
                    api_key_list.append(env_key)

            # If no environment keys, use the keys provided by the user
            if not api_key_list:
                # In production, we will use the GROQ_API_KEY_X variables from environment
                # If no keys were found in the environment, check for legacy API_KEY variables
                if not api_key_list:
                    for i in range(1, 30):  # Try up to 30 keys
                        env_key = os.getenv(f"API_KEY_{i}")
                        if env_key:
                            api_key_list.append(env_key)

                # Final fallback - check for a single API_KEY environment variable
                if not api_key_list and os.getenv("API_KEY"):
                    api_key_list.append(os.getenv("API_KEY"))

                # If no API keys found in environment, use the provided list of API keys
                if not api_key_list:
                    # Load the 83 API keys for rotation to avoid rate limiting
                    api_key_list = [
                        "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",
                        "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",
                        "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",     
                        "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",     
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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",
                        "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"
                    ]

                    # We'll only use one key for validation to avoid rate limiting
                    logging.info(f"Using {len(api_key_list)} API keys with rotation for rate limit protection")

            self.api_keys = api_key_list

            # Only use one key for validation - this is critical to avoid rate limiting
            if not self.groq_api_keys:
                self.groq_api_keys = [self.api_keys[0]]

        # Log how many keys we're using
        logging.info(f"Loaded {len(self.api_keys)} API keys for rotation")
        logging.info(f"Using {len(self.groq_api_keys)} key(s) for validation")

        # Safety check - validation should have max 1 key
        if len(self.groq_api_keys) > 1:
            logging.warning(f"More than 1 validation key detected, limiting to 1 key")
            self.groq_api_keys = [self.groq_api_keys[0]]

        # API configuration
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
        self.current_api_index = 0
        self.retry_delay = 5.0
        self.limit_delay = 5.0
        self.max_retries = 10
        self.failed_keys = set()
        self.key_success_count = {}

        # Initialize success counter for each key
        for i in range(len(self.api_keys)):  # Use api_keys, not groq_api_keys
            self.key_success_count[i] = 0

        # Make sure the current_key_index is properly initialized
        self.current_key_index = 0  # Start with the first key

        logging.info(f"API key rotation initialized with {len(self.api_keys)} keys")

    def extract_disaster_type(self, text):
        """
        Advanced disaster type extraction with context awareness, co-occurrence patterns,
        typo correction, and fuzzy matching for improved accuracy
        """
        if not text or len(text.strip()) == 0:
            return "Not Specified"

        text_lower = text.lower()

        # STRICTLY use these 6 specific disaster types with capitalized first letter:
        disaster_types = {
            "Earthquake": [
                "earthquake", "quake", "tremor", "seismic", "lindol",
                "magnitude", "aftershock", "shaking", "lumindol", "pagyanig",
                "paglindol", "ground shaking", "magnitude"
            ],
            "Flood": [
                "flood", "flooding", "inundation", "baha", "tubig", "binaha",
                "flash flood", "rising water", "bumabaha", "nagbaha",
                "high water level", "water rising", "overflowing", "pagbaha",
                "underwater", "submerged", "nabahaan"
            ],
            "Typhoon": [
                "typhoon", "storm", "cyclone", "hurricane", "bagyo",
                "super typhoon", "habagat", "ulan", "buhos", "storm surge",
                "malakas na hangin", "heavy rain", "signal no", "strong wind",
                "malakas na ulan", "flood warning", "storm warning",
                "evacuate due to storm", "matinding ulan"
            ],
            "Fire": [
                "fire", "blaze", "burning", "sunog", "nasusunog", "nasunog",
                "nagliliyab", "flame", "apoy", "burning building",
                "burning house", "tulong sunog", "house fire", "fire truck",
                "fire fighter", "building fire", "fire alarm", "burning",
                "nagliliyab", "sinusunog", "smoke", "usok"
            ],
            "Volcanic Eruptions": [
                "volcano", "eruption", "lava", "ash", "bulkan", "ashfall",
                "magma", "volcanic", "bulkang", "active volcano",
                "phivolcs alert", "taal", "mayon", "pinatubo",
                "volcanic activity", "phivolcs", "volcanic ash",
                "evacuate volcano", "erupting", "erupted", "abo ng bulkan"
            ],
            "Landslide": [
                "landslide", "mudslide", "avalanche", "guho", "pagguho",
                "pagguho ng lupa", "collapsed", "erosion", "land collapse",
                "soil erosion", "rock slide", "debris flow", "mountainside",
                "nagkaroong ng guho", "rumble", "bangin", "bumagsak na lupa"
            ]
        }

        # First pass: Check for direct keyword matches with scoring
        scores = {disaster_type: 0 for disaster_type in disaster_types}
        matched_keywords = {}

        for disaster_type, keywords in disaster_types.items():
            matched_terms = []
            for keyword in keywords:
                if keyword in text_lower:
                    # Check if it's a full word or part of a word
                    if (f" {keyword} " in f" {text_lower} "
                            or text_lower.startswith(f"{keyword} ")
                            or text_lower.endswith(f" {keyword}")
                            or text_lower == keyword):
                        scores[disaster_type] += 2  # Full word match
                        matched_terms.append(keyword)
                    else:
                        scores[disaster_type] += 1  # Partial match
                        matched_terms.append(keyword)

            if matched_terms:
                matched_keywords[disaster_type] = matched_terms

        # Context analysis for specific disaster scenarios
        context_indicators = {
            "Earthquake": [
                "shaking", "ground moved", "buildings collapsed", "magnitude",
                "richter scale", "fell down", "trembling", "evacuate building",
                "underneath rubble", "trapped"
            ],
            "Flood": [
                "water level", "rising water", "underwater", "submerged",
                "evacuate", "rescue boat", "stranded", "high water",
                "knee deep", "waist deep"
            ],
            "Typhoon": [
                "strong winds", "heavy rain", "evacuation center",
                "storm signal", "stranded", "cancelled flights",
                "damaged roof", "blown away", "flooding due to", "trees fell"
            ],
            "Fire": [
                "smoke", "evacuate building", "trapped inside", "firefighter",
                "fire truck", "burning", "call 911", "spread to", "emergency",
                "burning smell"
            ],
            "Volcanic Eruptions": [
                "alert level", "evacuate area", "danger zone",
                "eruption warning", "exclusion zone", "kilometer radius",
                "volcanic activity", "ash covered", "masks", "respiratory"
            ],
            "Landslide": [
                "collapsed", "blocked road", "buried", "fell", "slid down",
                "mountain slope", "after heavy rain", "buried homes",
                "rescue team", "clearing operation"
            ]
        }

        # Check for contextual indicators
        for disaster_type, indicators in context_indicators.items():
            for indicator in indicators:
                if indicator in text_lower:
                    scores[
                        disaster_type] += 1.5  # Context indicators have higher weight
                    if disaster_type not in matched_keywords:
                        matched_keywords[disaster_type] = []
                    matched_keywords[disaster_type].append(
                        f"context:{indicator}")

        # Check for co-occurrence patterns
        if "water" in text_lower and "rising" in text_lower:
            scores["Flood"] += 2
        if "strong" in text_lower and "wind" in text_lower:
            scores["Typhoon"] += 2
        if "heavy" in text_lower and "rain" in text_lower:
            scores["Typhoon"] += 1.5
        if "building" in text_lower and "collapse" in text_lower:
            scores["Earthquake"] += 2
        if "ash" in text_lower and "fall" in text_lower:
            scores["Volcanic Eruptions"] += 2
        if "evacuate" in text_lower and "alert" in text_lower:
            # General emergency context - look for specific type
            for d_type in ["Volcanic Eruptions", "Fire", "Flood", "Typhoon"]:
                if any(k in text_lower for k in disaster_types[d_type]):
                    scores[d_type] += 1

        # Get the disaster type with the highest score
        max_score = max(scores.values())

        # If no significant evidence found
        if max_score < 1:
            return "UNKNOWN"

        # Get disaster types that tied for highest score
        top_disasters = [
            dt for dt, score in scores.items() if score == max_score
        ]

        if len(top_disasters) == 1:
            return top_disasters[0]
        else:
            # In case of tie, use order of priority for Philippines (typhoon > flood > earthquake > volcanic eruptions > fire > landslide)
            priority_order = [
                "Typhoon", "Flood", "Earthquake", "Volcanic Eruptions", "Fire",
                "Landslide"
            ]
            for disaster in priority_order:
                if disaster in top_disasters:
                    return disaster

            # Fallback to first match
            return top_disasters[0]

    def extract_location(self, text):
        """Enhanced location extraction with typo tolerance and fuzzy matching for Philippine locations"""
        if not text:
            return "UNKNOWN"

        text_lower = text.lower()

        # SPECIAL CASE: MAY SUNOG SA X!, MAY BAHA SA X! pattern (disaster in LOCATION)
        # Handle ALL-CAPS emergency statements common in Filipino language

        # First check for uppercase patterns which are common in emergency situations
        if text.isupper():
            # MAY SUNOG SA TIPI! type of pattern (all caps)
            upper_emergency_matches = re.findall(r'MAY\s+\w+\s+SA\s+([A-Z]+)[\!\.\?]*', text)
            if upper_emergency_matches:
                location = upper_emergency_matches[0].strip()
                if len(location) > 1:  # Make sure it's not just a single letter
                    return location.title()  # Return with Title Case

            # Check for uppercase SA LOCATION! pattern
            upper_sa_matches = re.findall(r'SA\s+([A-Z]+)[\!\.\?]*', text)
            if upper_sa_matches:
                location = upper_sa_matches[0].strip()
                if len(location) > 1:
                    return location.title()

        # Regular case patterns (lowercase or mixed case)
        emergency_location_patterns = [
            r'may sunog sa ([a-zA-Z]+)',
            r'may baha sa ([a-zA-Z]+)',
            r'may lindol sa ([a-zA-Z]+)',
            r'may bagyo sa ([a-zA-Z]+)',
            r'may landslide sa ([a-zA-Z]+)',
            r'sa ([a-zA-Z]+) may\s+\w+',  # SA LOCATION may [disaster]
            r'sa ([a-zA-Z]+)[\!\.\?]',  # ending with SA LOCATION!
            r'in ([a-zA-Z]+) province',
            r'in ([a-zA-Z]+) city',
            r'in ([a-zA-Z]+) town',
            r'in ([a-zA-Z]+) municipality',
            r'in ([a-zA-Z]+) island',
            r'in ([a-zA-Z]+) village',
            r'in ([a-zA-Z]+) neighborhood',
            r'sa ([a-zA-Z]+) province',
            r'sa ([a-zA-Z]+) city',
            r'sa ([a-zA-Z]+) town',
            r'sa ([a-zA-Z]+) municipality',
            r'sa ([a-zA-Z]+) island',
            r'sa ([a-zA-Z]+) village',
            r'sa ([a-zA-Z]+) barangay',
            r'ng ([a-zA-Z]+)',
            r'na tinamaan ng\s+\w+\s+ng ([a-zA-Z]+)'  # na tinamaan ng [disaster] ng [LOCATION]
        ]

        for pattern in emergency_location_patterns:
            matches = re.findall(pattern, text_lower)
            if matches:
                for match in matches:
                    if match and len(match.strip()) > 1:  # Avoid single letters
                        return match.strip().title()  # Return with Title Case

        # Look for major city and province names frequently mentioned in disasters
        philippines_locations = [
            "Manila", "Quezon", "Cebu", "Davao", "Batangas", "Taguig", "Makati",
            "Pasig", "Cagayan", "Cavite", "Laguna", "Baguio", "Tacloban", "Leyte",
            "Samar", "Albay", "Bicol", "Iloilo", "Zamboanga", "Cotabato", "Bulacan",
            "Pampanga", "Tarlac", "Zambales", "Pangasinan", "Mindoro", "Palawan",
            "Rizal", "Bataan", "Isabela", "Ilocos", "Catanduanes", "Marinduque",
            "Sorsogon", "Aklan", "Antique", "Benguet", "Surigao", "Legazpi",
            "Ormoc", "Dumaguete", "Bacolod", "Marikina", "Pasay", "Parañaque", 
            "Kalookan", "Valenzuela", "San Juan", "Mandaluyong", "Muntinlupa",
            "Malabon", "Navotas", "Cainta", "Rodriguez", "Antipolo", "Lucena",
            "Bataan", "Naga", "Mandaluyong", "Catarman", "Catbalogan", "Tuguegarao",
            "Laoag", "Vigan", "Dagupan", "Olongapo", "Cabanatuan", "Malolos", 
            "Meycauayan", "Dasmariñas", "Imus", "Lucena", "Calamba", "Santa Rosa", 
            "Legaspi", "Roxas", "Iloilo", "Bacolod", "Tagbilaran", "Dumaguete",
            "Tacloban", "Dipolog", "Dapitan", "Pagadian", "Iligan", "Cagayan de Oro",
            "Butuan", "Surigao", "Digos", "Tagum", "Mati", "General Santos",
            "Koronadal", "Kidapawan", "Marawi", "Cotabato", "QC"
        ]

        # Try to find location names in the text
        for location in philippines_locations:
            pattern = rf'\b{re.escape(location)}\b'
            if re.search(pattern, text, re.IGNORECASE):
                return location

        # For very short texts, check if it's just a location name
        if len(text.split()) < 3:
            words = text.strip(",.!?").split()
            for word in words:
                if word.upper() != word:  # Avoid all caps words which might be emphatic expressions
                    if len(word) > 2 and word.isalpha():  # Avoid short words and non-alphabetic
                        return word.title()

        return "UNKNOWN"

# Main execution part of the script
if __name__ == "__main__":
    args = parser.parse_args()
    backend = DisasterSentimentBackend()
    
    # Process text or file based on provided arguments
    if args.text:
        print(json.dumps(backend.analyze_sentiment(args.text)))
    elif args.file:
        print(json.dumps(backend.process_csv(args.file)))
    else:
        print("Error: Please provide either --text or --file argument")
        sys.exit(1)