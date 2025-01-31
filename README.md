# ssh-tunnel-proxy-client
# Turoxy

[![License](https://img.shields.io/github/license/mesutrk95/turoxy)](https://github.com/mesutrk95/turoxy/blob/main/LICENSE)
[![GitHub Release](https://img.shields.io/github/v/release/mesutrk95/turoxy)](https://github.com/mesutrk95/turoxy/releases)
[![Platform Support](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)]()

A lightweight and secure proxy application leveraging SSH port forwarding capabilities for seamless network traffic tunneling.

## 🚀 Quick Start

### Download Pre-built Binaries

Download the latest version for your platform:

- [Windows (x64)](https://github.com/mesutrk95/turoxy/releases)
- [macOS (x64/ARM)](https://github.com/mesutrk95/turoxy/releases)
- [Ubuntu/Linux (x64)](https://github.com/mesutrk95/turoxy/releases)

### Running from Source

```bash
# Clone the repository
git clone https://github.com/mesutrk95/turoxy.git

# Navigate to the project directory
cd turoxy

# Install dependencies for core
npm install

# Install UI dependencies
cd ./ui
npm install

# Return to root and start development server
cd ..
npm run dev
```

## 🔑 Key Features

- **SSH-Based Tunneling**: Enterprise-grade security using SSH protocol for traffic forwarding
- **Flexible Port Forwarding**: Support for both local and remote port forwarding configurations
- **User-Friendly Interface**: Intuitive GUI for managing connections and configurations
- **Cross-Platform**: Native support for Windows, macOS, and Linux
- **Resource Efficient**: Minimal CPU and memory footprint
- **Connection Management**: Save and manage multiple tunnel configurations
- **Auto-Reconnect**: Automatically restore connections after network interruptions

## 🛠️ Configuration

1. Launch Turoxy
2. Add a new connection with:
   - SSH server details (hostname, port)
   - Authentication credentials (username/password or SSH key)
   - Port forwarding rules
3. Save your configuration
4. Connect and start tunneling!

## 🔒 Security Features

- End-to-end encryption using SSH protocol
- Support for key-based authentication
- No modification or inspection of tunneled traffic
- Regular security updates
- Optional connection timeout settings
- Secure credential storage

## 💡 Use Cases

- Secure remote access to services
- Development environment tunneling
- Database connection encryption
- API testing through secure proxies
- Remote server administration

## 📝 Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

- Report bugs by creating a GitHub issue
- Follow project updates

## 🙏 Acknowledgments

- OpenSSH project
- Node.js community
- All our contributors

---

Made with ❤️ by [mesutrk95](https://github.com/mesutrk95)