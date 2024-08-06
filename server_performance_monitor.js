const os = require('os');
const { exec } = require('child_process');
const { Client } = require('pg');
const crypto = require('crypto');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

let systemId;
let serverName;

async function connectToDatabase() {
    try {
        await client.connect();
        console.log('Connected to the database');
        await getOrUpdateServerName();
    } catch (err) {
        console.error('Error connecting to the database', err);
        process.exit(1);
    }
}

function getSystemId() {
    const interfaces = os.networkInterfaces();
    let macAddress;
    for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
            if (!interface.internal && interface.mac !== '00:00:00:00:00:00') {
                macAddress = interface.mac;
                break;
            }
        }
        if (macAddress) break;
    }
    if (!macAddress) {
        console.error('Could not determine MAC address');
        process.exit(1);
    }
    return crypto.createHash('sha256').update(macAddress).digest('hex');
}

async function getOrUpdateServerName() {
    const envServerName = process.env.SERVER_NAME;
    if (!envServerName) {
        console.error('SERVER_NAME environment variable is not set');
        process.exit(1);
    }

    const query = 'SELECT server_name FROM server_performance WHERE system_id = $1 LIMIT 1';
    const result = await client.query(query, [systemId]);

    if (result.rows.length > 0 && result.rows[0].server_name !== envServerName) {
        // Update the server name if it has changed
        await client.query('UPDATE server_performance SET server_name = $1 WHERE system_id = $2', [envServerName, systemId]);
        console.log(`Updated server name to: ${envServerName}`);
    } else if (result.rows.length === 0) {
        console.log(`New server detected. Setting name to: ${envServerName}`);
    }

    serverName = envServerName;
    console.log(`Server Name: ${serverName}`);
}

function getCpuUsage() {
    return new Promise((resolve) => {
        const startMeasure = cpuAverage();

        setTimeout(() => {
            const endMeasure = cpuAverage();
            const idleDifference = endMeasure.idle - startMeasure.idle;
            const totalDifference = endMeasure.total - startMeasure.total;
            const percentageCpu = 100 - Math.floor((100 * idleDifference) / totalDifference);
            resolve(percentageCpu);
        }, 100);
    });
}

function cpuAverage() {
    const cpus = os.cpus();
    let idleMs = 0;
    let totalMs = 0;

    for (const cpu of cpus) {
        for (const type in cpu.times) {
            totalMs += cpu.times[type];
        }
        idleMs += cpu.times.idle;
    }

    return {
        idle: idleMs / cpus.length,
        total: totalMs / cpus.length,
    };
}

function getMemoryUsage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    return ((totalMemory - freeMemory) / totalMemory) * 100;
}

function getDiskUsage() {
    return new Promise((resolve, reject) => {
        exec("df -h / | awk 'NR==2 {print $5}'", (error, stdout, stderr) => {
            if (error) {
                reject(`Error: ${error.message}`);
                return;
            }
            if (stderr) {
                reject(`Error: ${stderr}`);
                return;
            }
            resolve(parseFloat(stdout));
        });
    });
}

function getNetworkInterface() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        const interface = interfaces[name];
        for (const info of interface) {
            if (info.family === 'IPv4' && !info.internal) {
                return name;
            }
        }
    }
    return null;
}

function getNetworkUsage() {
    return new Promise((resolve, reject) => {
        const interface = getNetworkInterface();
        if (!interface) {
            reject(new Error('No suitable network interface found'));
            return;
        }

        exec(`cat /proc/net/dev | grep ${interface}:`, (error, stdout, stderr) => {
            if (error) {
                reject(`Error: ${error.message}`);
                return;
            }
            if (stderr) {
                reject(`Error: ${stderr}`);
                return;
            }
            const parts = stdout.split(/\s+/);
            resolve({
                in: parseFloat(parts[2]) / (1024 * 1024), // Convert to MB
                out: parseFloat(parts[10]) / (1024 * 1024), // Convert to MB
            });
        });
    });
}

async function capturePerformanceMetrics() {
    try {
        const cpuUsage = await getCpuUsage();
        const memoryUsage = getMemoryUsage();
        const diskUsage = await getDiskUsage();
        const networkUsage = await getNetworkUsage();

        const insertQuery = `
            INSERT INTO server_performance (system_id, server_name, cpu_usage, memory_usage, disk_usage, network_in, network_out)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        const insertValues = [systemId, serverName, cpuUsage, memoryUsage, diskUsage, networkUsage.in, networkUsage.out];

        await client.query(insertQuery, insertValues);

        // Delete older records, keeping only the latest 51,840 (3 days worth)
        const deleteQuery = `
            DELETE FROM server_performance
            WHERE id IN (
                SELECT id
                FROM (
                    SELECT id,
                           ROW_NUMBER() OVER (PARTITION BY system_id ORDER BY timestamp DESC) as row_num
                    FROM server_performance
                    WHERE system_id = $1
                ) ranked
                WHERE row_num > 51840
            )
        `;
        const deleteResult = await client.query(deleteQuery, [systemId]);

        console.log('Performance metrics captured and stored in the database');
        if (deleteResult.rowCount > 0) {
            console.log(`Deleted ${deleteResult.rowCount} old records for system ${systemId}`);
        }
    } catch (err) {
        console.error('Error capturing or storing performance metrics', err);
    }
}

async function main() {
    await connectToDatabase();
    systemId = getSystemId();
    console.log(`System ID: ${systemId}`);

    setInterval(capturePerformanceMetrics, 5000); // Run every 5 seconds
}

main().catch(console.error);
