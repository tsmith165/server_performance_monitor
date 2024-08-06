# Server Performance Monitor

This Node.js script monitors server performance metrics and stores them in a PostgreSQL database.

## Setup

1. Clone this repository:

    ```
    git clone https://github.com/tsmith165/server_performance_monitor.git
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

2. Reload the systemd daemon:

    ```
    sudo systemctl daemon-reload
    ```

3. Enable and start the service:

    ```
    sudo systemctl enable server-performance-monitor.service
    sudo systemctl start server-performance-monitor.service
    ```

4. Check the status of the service:
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
