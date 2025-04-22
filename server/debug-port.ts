import net from 'net';

export function checkPort(port: number, host: string = '0.0.0.0'): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isOpen = false;
    let timeoutId: NodeJS.Timeout;

    socket.on('connect', () => {
      isOpen = true;
      socket.destroy();
      clearTimeout(timeoutId);
      resolve(true);
    });

    socket.on('error', () => {
      socket.destroy();
      clearTimeout(timeoutId);
      resolve(false);
    });

    timeoutId = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, 1000);

    socket.connect(port, host);
  });
}

export async function checkPortPeriodically(port: number, host: string = '0.0.0.0', interval: number = 500, maxAttempts: number = 10): Promise<void> {
  console.log(`Starting port check: ${host}:${port}`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const isOpen = await checkPort(port, host);
    console.log(`Port ${port} check attempt ${attempt}/${maxAttempts}: ${isOpen ? 'OPEN' : 'CLOSED'}`);
    
    if (isOpen) {
      console.log(`Port ${port} is confirmed OPEN on ${host}`);
      return;
    }
    
    // Wait before next check
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  console.log(`Port ${port} check failed after ${maxAttempts} attempts`);
}