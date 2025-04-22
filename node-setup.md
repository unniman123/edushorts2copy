# Node.js Version Setup Instructions

1. Install NVM for Windows
   - Download NVM for Windows from: https://github.com/coreybutler/nvm-windows/releases
   - Download the latest nvm-setup.exe
   - Run the installer

2. Open a new Command Prompt as Administrator and run:
   ```bash
   nvm install 18.18.0
   nvm use 18.18.0
   ```

3. Verify the installation:
   ```bash
   node -v
   # Should show v18.18.0
   ```

4. Run the EAS command:
   ```bash
   npx eas update:configure
   ```

5. After completing the EAS command, you can switch back to Node.js 20:
   ```bash
   nvm use 20.19.0
   ```

Note: Make sure to close and reopen your terminal after installing NVM for Windows.
