using System;
using System.IO;
using System.Text;
using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;
using System.Drawing;
using System.Diagnostics;
using System.Windows.Forms;

internal sealed class FrameServer : IDisposable {
    private readonly TcpListener listener = new TcpListener(IPAddress.Loopback, 8767);
    private volatile bool running;
    public volatile bool Enabled = true;
    public void Start() { listener.Start(8); running = true; Task.Run((Action)Loop); }
    private void Loop() {
        while (running) {
            try { using (TcpClient client = listener.AcceptTcpClient()) { Serve(client); } }
            catch (SocketException) { if (!running) break; }
            catch (IOException) { }
            catch (ObjectDisposedException) { break; }
        }
    }
    private void Serve(TcpClient client) {
        client.ReceiveTimeout = 1500; client.SendTimeout = 1500;
        using (NetworkStream stream = client.GetStream()) {
            byte[] bytes = new byte[4096]; int count = 0;
            while (count < bytes.Length) {
                int read = stream.Read(bytes, count, bytes.Length - count); if (read == 0) return; count += read;
                if (Encoding.ASCII.GetString(bytes, 0, count).Contains("\r\n\r\n")) break;
            }
            string request = Encoding.ASCII.GetString(bytes, 0, count);
            string[] line = request.Split(new string[] { "\r\n" }, StringSplitOptions.None)[0].Split(' ');
            bool valid = line.Length >= 2 && line[0] == "GET" && (line[1] == "/state" || line[1] == "/health");
            string body = valid ? "{\"app\":\"frame\",\"version\":\"0.1.0\",\"enabled\":" + (Enabled ? "true" : "false") + "}" : "{\"error\":\"route not found\"}";
            string origin = "chrome-extension://" + File.ReadAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "extension-id.txt")).Trim();
            string header = "HTTP/1.1 " + (valid ? "200 OK" : "404 Not Found") + "\r\nContent-Type: application/json; charset=utf-8\r\nContent-Length: " + Encoding.UTF8.GetByteCount(body) + "\r\nAccess-Control-Allow-Origin: " + origin + "\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nConnection: close\r\n\r\n";
            byte[] response = Encoding.UTF8.GetBytes(header + body); stream.Write(response, 0, response.Length);
        }
    }
    public void Dispose() { running = false; listener.Stop(); }
}

internal sealed class FrameContext : ApplicationContext {
    private readonly NotifyIcon tray;
    private readonly FrameServer server;
    private readonly ToolStripMenuItem toggle;
    public FrameContext() {
        server = new FrameServer(); server.Start();
        ContextMenuStrip menu = new ContextMenuStrip();
        toggle = new ToolStripMenuItem("YouTube araçları açık"); toggle.Checked = true; toggle.CheckOnClick = true;
        toggle.CheckedChanged += delegate { server.Enabled = toggle.Checked; tray.Text = toggle.Checked ? "Frame — YouTube araçları açık" : "Frame — YouTube araçları kapalı"; };
        menu.Items.Add(toggle); menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add("Kelime kütüphanem", null, delegate { OpenApp("index.html#cards"); });
        menu.Items.Add("Örnek çalışma alanı", null, delegate { OpenApp("index.html"); });
        menu.Items.Add("Bağlantılar ve AI", null, delegate { OpenApp("settings.html"); });
        menu.Items.Add("YouTube'u aç", null, delegate { Process.Start(new ProcessStartInfo("https://www.youtube.com/") { UseShellExecute = true }); });
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add("Frame'den çık", null, delegate { ExitThread(); });
        Icon icon = File.Exists(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "frame.ico")) ? new Icon(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "frame.ico")) : SystemIcons.Application;
        tray = new NotifyIcon { Icon = icon, Text = "Frame — YouTube araçları açık", ContextMenuStrip = menu, Visible = true };
        tray.DoubleClick += delegate { OpenApp("index.html#cards"); };
        tray.BalloonTipTitle = "Frame arka planda hazır";
        tray.BalloonTipText = "Eklenti yüklüyse YouTube videolarında Frame paneli otomatik açılır. Sağ tık ile yönetebilirsin.";
        tray.ShowBalloonTip(3500);
    }
    private void OpenApp(string page) {
        string id = File.ReadAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "extension-id.txt")).Trim();
        string chrome = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Google\\Chrome\\Application\\chrome.exe");
        if (!File.Exists(chrome)) { MessageBox.Show("Google Chrome bulunamadı.", "Frame"); return; }
        Process.Start(new ProcessStartInfo(chrome, "--app=chrome-extension://" + id + "/" + page) { UseShellExecute = true });
    }
    protected override void ExitThreadCore() { tray.Visible = false; tray.Dispose(); server.Dispose(); base.ExitThreadCore(); }
}

internal static class Program {
    [STAThread]
    private static int Main(string[] args) {
        if (args.Length > 0 && args[0] == "--selfcheck") {
            try {
                using (FrameServer server = new FrameServer()) {
                    server.Start();
                    using (WebClient client = new WebClient()) {
                        string initial = client.DownloadString("http://127.0.0.1:8767/state");
                        if (!initial.Contains("\"enabled\":true")) return 2;
                        server.Enabled = false;
                        string disabled = client.DownloadString("http://127.0.0.1:8767/state");
                        if (!disabled.Contains("\"enabled\":false")) return 3;
                        File.WriteAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "tray-selfcheck.json"), "{\"passed\":true,\"checks\":[\"loopback-state\",\"enable-disable\"]}");
                    }
                }
                return 0;
            } catch (Exception error) { File.WriteAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "tray-selfcheck.json"), "FAILED: " + error.Message); return 1; }
        }
        bool created;
        using (Mutex mutex = new Mutex(true, "Local\\FrameLanguageLearningPrototype", out created)) {
            if (!created) return 0;
            Application.EnableVisualStyles(); Application.SetCompatibleTextRenderingDefault(false);
            try { Application.Run(new FrameContext()); return 0; }
            catch (Exception error) { MessageBox.Show("Frame başlatılamadı: " + error.Message, "Frame"); return 1; }
        }
    }
}
