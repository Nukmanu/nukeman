// --- KONFIGURASI ---
const MQTT_CONFIG = {
    host: 'broker.emqx.io',
    port: 8083,
    clientId: 'CLIENT_EWS_' + Math.random().toString(16).substr(2, 5),
    user: 'TOKEN_DARI_AVISHA', 
    pass: 'PASS_AVISHA'
};

const client = new Paho.MQTT.Client(MQTT_CONFIG.host, MQTT_CONFIG.port, MQTT_CONFIG.clientId);
let csvData = []; // Menampung riwayat data untuk CSV

// --- MQTT CALLBACKS ---
function onConnect() {
    updateStatusUI(true);
    client.subscribe("suhu_ruang");
    client.subscribe("tekanan_udara");
    client.subscribe("kadar_gas");
    client.subscribe("status");
}

function onMessageArrived(message) {
    const topic = message.destinationName;
    const payload = message.payloadString;
    const time = new Date().toLocaleTimeString('id-ID'); // Ambil waktu saat data tiba

    // Simpan data untuk CSV
    csvData.push({ waktu: new Date().toLocaleString(), topik: topic, nilai: payload });

    // Update UI berdasarkan Topic
    if (topic === "suhu_ruang") {
        document.getElementById('temp-val').innerText = payload + "°C";
        addLog(`Update Suhu: ${payload}°C`); // Kirim ke log
    } 
    else if (topic === "tekanan_udara") {
        document.getElementById('pres-val').innerText = payload + " hPa";
        addLog(`Update Tekanan: ${payload} hPa`);
    } 
    else if (topic === "kadar_gas") {
        document.getElementById('gas-val').innerText = payload;
        const card = document.getElementById('card-gas');
        if (parseInt(payload) > 1500) {
            card.classList.add('warning-border');
            addLog(`⚠️ BAHAYA: Kadar gas tinggi! (${payload})`, true);
        } else {
            card.classList.remove('warning-border');
            addLog(`Kadar gas normal: ${payload}`);
        }
    }
    else if (topic === "status") {
        addLog(`Pesan Device: ${payload}`);
    }
}

// --- FUNGSI LOG ---
function addLog(msg, isDanger = false) {
    const container = document.getElementById('logs');
    const time = new Date().toLocaleTimeString('id-ID');
    
    const div = document.createElement('div');
    div.className = `log-item ${isDanger ? 'danger-log' : ''}`;
    
    // Disini WAKTU disematkan ke setiap baris log
    div.innerHTML = `
        <span style="font-weight:600">${msg}</span>
        <span style="font-size:0.75rem; color:gray">${time}</span>
    `;
    
    container.prepend(div); // Munculkan data terbaru di posisi paling atas
    
    // Batasi log agar tidak memberatkan browser (max 50 baris)
    if (container.children.length > 50) container.lastChild.remove();
}

// --- UI UTILITY ---
function updateStatusUI(connected) {
    const dot = document.getElementById('status-dot');
    const txt = document.getElementById('status-text');
    dot.className = connected ? "dot online" : "dot offline";
    txt.innerText = connected ? "Online" : "Offline";
    addLog(connected ? "Sistem berhasil terhubung ke Broker" : "Koneksi ke Broker terputus!");
}

// Download CSV
document.getElementById('download-csv').onclick = function() {
    if(csvData.length === 0) return alert("Belum ada data untuk diunduh!");
    
    let csv = "Waktu,Topik,Nilai\n";
    csvData.forEach(r => {
        csv += `"${r.waktu}","${r.topik}","${r.nilai}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Log_EWS_${Date.now()}.csv`;
    a.click();
};

// Jam Update
setInterval(() => {
    document.getElementById('clock').innerText = new Date().toLocaleTimeString('id-ID');
}, 1000);

// Start
client.onConnectionLost = () => updateStatusUI(false);
client.onMessageArrived = onMessageArrived;
client.connect({ onSuccess: onConnect, useSSL: true, reconnect: true });