const os = require('os');
const { exec } = require('child_process');
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

async function connectToDatabase() {
    try {
        await client.connect();
        console.log('Connected to the database');
    } catch (err) {
        console.error('Error connecting to the database', err);
        process.exit(1);
    }
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

function getNetworkUsage() {
    return new Promise((resolve, reject) => {
        exec('cat /proc/net/dev | grep eth0:', (error, stdout, stderr) => {
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

        const query = `
            INSERT INTO server_performance (cpu_usage, memory_usage, disk_usage, network_in, network_out)
            VALUES ($1, $2, $3, $4, $5)
        `;
        const values = [cpuUsage, memoryUsage, diskUsage, networkUsage.in, networkUsage.out];

        await client.query(query, values);
        console.log('Performance metrics captured and stored in the database');
    } catch (err) {
        console.error('Error capturing or storing performance metrics', err);
    }
}

async function main() {
    await connectToDatabase();

    setInterval(capturePerformanceMetrics, 5000); // Run every 5 seconds
}

main().catch(console.error);
