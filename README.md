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
