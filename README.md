# Server Performance Monitor

This Node.js script monitors server performance metrics and stores them in a PostgreSQL database.

## Prerequisites

### Installing Node.js and npm on Ubuntu

1. Update your package list:

    ```
    sudo apt update
    ```

2. Install Node.js and npm:

    ```
    sudo apt install nodejs npm
    ```

3. Verify the installation:

    ```
    node --version
    npm --version
    ```

    If you need a specific version of Node.js, consider using nvm (Node Version Manager):

4. Install nvm:

    ```
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
    ```

5. Restart your terminal or run:

    ```
    source ~/.bashrc
    ```

6. Install and use a specific Node.js version (e.g., 18.x):
    ```
    nvm install 18
    nvm use 18
    ```

## Setup

1. Clone this repository:

    ```
    mkdir /root/scripts
    cd /root/scripts
    git clone https://github.com/tsmith165/server-performance-monitor.git
    cd server-performance-monitor
    ```

2. Install dependencies:
   // File 1: /package.json

{
"name": "battlemetrics_scrapper",
"version": "0.1.1",
"type": "module",
"private": true,
"engines": {
"node": "20.x"
},
"scripts": {
"build": "tsc",
"start-all": "pnpm build && node dist/tests/run_scrapper.js -a -d 50000",
"start-interval": "pnpm build && node dist/tests/run_scrapper.js -i -d 50000"
},
"dependencies": {
"@neondatabase/serverless": "^0.9.1",
"@react-email/components": "^0.0.22",
"axios": "^1.6.7",
"dotenv": "^16.4.5",
"drizzle-orm": "^0.30.1",
"global": "^4.4.0",
"module-alias": "^2.2.3",
"moment": "^2.30.1",
"moment-timezone": "^0.5.45",
"pg": "^8.11.5",
"react": "^18.3.1",
"resend": "^3.5.0",
"yargs": "^17.7.2"
},
"devDependencies": {
"@types/node": "20.11.17",
"@types/pg": "^8.11.6",
"@types/yargs": "^17.0.32",
"eslint": "8.56.0",
"ts-loader": "^9.5.1",
"ts-node": "^10.9.2",
"typescript": "^5.4.2"
}
}

    ```
    npm install
    ```

3. Copy `.env.example` to `.env` and fill in your database URL:

    ```
    cp .env.example .env
    ```

4. Edit the `.env` file with your actual database URL.

## Running the Script

To run the script manually:

```
npm start
```

## Setting up as a System Service

To run the script as a system service that starts on boot and restarts on failure:

1. Copy the `server-performance-monitor.service` file to the systemd directory:

    ```
    sudo cp server-performance-monitor.service /etc/systemd/system/
    ```

2. Edit the service file to set the correct paths and user:

    ```
    sudo nano /etc/systemd/system/server-performance-monitor.service
    ```

    Update the `ExecStart`, `User`, and `WorkingDirectory` fields as necessary.

3. Reload the systemd daemon:

    ```
    sudo systemctl daemon-reload
    ```

4. Enable and start the service:

    ```
    sudo systemctl enable server-performance-monitor.service
    sudo systemctl start server-performance-monitor.service
    ```

5. Check the status of the service:
    ```
    sudo systemctl status server-performance-monitor.service
    ```

## Viewing Logs

To view the logs of the service:

```
sudo journalctl -u server-performance-monitor.service
```

## License

This project is licensed under the MIT License.
