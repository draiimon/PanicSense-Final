import { useState } from "react";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { loginSchema, type LoginUser } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

interface LoginResponse {
  token: string;
  message: string;
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginUser>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginUser) => {
    setIsLoading(true);
    try {
      const response = await apiRequest<LoginResponse>('POST', '/api/auth/login', values);
      if (response.token) {
        login(response.token);
        toast({
          title: "Welcome back!",
          description: "Successfully logged in to PanicSense PH",
        });
        // Force page reload to ensure auth state is fresh
        window.location.reload();
        window.location.href = '/dashboard';
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
      }}
      transition={{ duration: 0.6 }}
      className="min-h-screen w-full flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-indigo-50 to-white p-4"
    >
      <motion.div 
        variants={fadeIn}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="w-full max-w-md space-y-8"
      >
        <motion.div 
          variants={fadeIn}
          transition={{ delay: 0.3 }}
          className="text-center space-y-3"
        >
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            PanicSense PH
          </h1>
          <p className="text-xl text-gray-600">
            Disaster Sentiment Analysis Platform
          </p>
        </motion.div>

        <motion.div 
          variants={fadeIn}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-2xl backdrop-blur-sm bg-white/80">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Sign in to your account</CardTitle>
              <CardDescription>
                Enter your credentials to access the dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <motion.div 
                    variants={fadeIn}
                    transition={{ delay: 0.5 }}
                    className="space-y-2"
                  >
                    <Input
                      {...form.register("username")}
                      placeholder="Username"
                      type="text"
                      autoComplete="username"
                      className="h-12 text-lg bg-white/50 backdrop-blur-sm border-gray-200 focus:border-blue-500 transition-all duration-300"
                    />
                    {form.formState.errors.username && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.username.message}
                      </p>
                    )}
                  </motion.div>

                  <motion.div 
                    variants={fadeIn}
                    transition={{ delay: 0.6 }}
                    className="space-y-2"
                  >
                    <Input
                      {...form.register("password")}
                      placeholder="Password"
                      type="password"
                      autoComplete="current-password"
                      className="h-12 text-lg bg-white/50 backdrop-blur-sm border-gray-200 focus:border-blue-500 transition-all duration-300"
                    />
                    {form.formState.errors.password && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.password.message}
                      </p>
                    )}
                  </motion.div>

                  <motion.div
                    variants={fadeIn}
                    transition={{ delay: 0.7 }}
                  >
                    <Button
                      type="submit"
                      className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        "Sign in"
                      )}
                    </Button>
                  </motion.div>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 border-t pt-6">
              <motion.p 
                variants={fadeIn}
                transition={{ delay: 0.8 }}
                className="text-sm text-slate-600 text-center"
              >
                Don't have an account?{" "}
                <Link 
                  href="/signup" 
                  className="font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Sign up
                </Link>
              </motion.p>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}