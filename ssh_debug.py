import pty
import os
import time

# Config
HOST = "forge@13.53.205.215"
PASSWORD = "Hillbert9#"
CMD = "grep 'local.ERROR' /home/forge/egi-hub.13.53.205.215.sslip.io/current/backend/storage/logs/laravel.log | tail -n 10"

def read_until(fd, pattern, timeout=20):
    buffer = b""
    start = time.time()
    while time.time() - start < timeout:
        try:
            chunk = os.read(fd, 1024)
            if not chunk:
                break
            buffer += chunk
            # Check for both "password:" and "Password:"
            if b"password:" in buffer.lower():
                return buffer
        except OSError:
            break
    return buffer

pid, fd = pty.fork()

if pid == 0:
    # Child process
    # Add -v to debug connection
    os.execlp("ssh", "ssh", "-o", "StrictHostKeyChecking=no", HOST, CMD)
else:
    # Parent process
    # Wait for password prompt
    output = read_until(fd, "password:")
    
    if b"password:" in output.lower():
        # Send password
        os.write(fd, (PASSWORD + "\n").encode())
        
        # Read the rest of the output (the logs)
        time.sleep(2) # Give it a moment to run
        while True:
            try:
                chunk = os.read(fd, 4096)
                if not chunk: break
                print(chunk.decode(errors='ignore'), end='')
            except OSError:
                break
    else:
        print("Could not find password prompt. Output:", output.decode())
