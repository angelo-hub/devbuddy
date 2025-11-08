# Linear Buddy Licensing Model

Linear Buddy uses a **dual licensing model** similar to GitLens, allowing us to maintain an open-source core while offering premium features for advanced users.

## 📋 Overview

```
Repository Structure:
├── src/
│   ├── [Core features - MIT Licensed] ✅ FREE
│   └── pro/
│       └── [Premium features - Commercial License] 💎 PRO
├── LICENSE (MIT)
└── LICENSE.pro (Commercial)
```

## 🆓 Free Features (MIT License)

All core features of Linear Buddy are **completely free and open source** under the MIT License:

### Current Free Features
- ✅ View and manage Linear tickets in VS Code sidebar
- ✅ Create and update Linear tickets
- ✅ Convert TODOs to Linear tickets
- ✅ Branch management and association
- ✅ Basic AI-powered PR summaries (using GitHub Copilot)
- ✅ Basic AI-powered standup generation
- ✅ Chat interface (@linear commands)
- ✅ Status updates and workflow management
- ✅ GitHub/GitLab/Bitbucket permalink generation

**License:** MIT  
**Cost:** Free forever  
**Source Code:** Fully open source  
**Can be modified:** Yes  
**Can be redistributed:** Yes  

## 💎 Pro Features (Commercial License)

Pro features are located in the `src/pro/` and `webview-ui/src/pro/` directories and require a valid license:

### Planned Pro Features
- 🔮 **Advanced AI Analytics**: Deep insights into your workflow patterns
- 🎯 **Smart Task Prioritization**: AI-powered task recommendations
- 📊 **Team Analytics Dashboard**: Visualize team velocity and productivity
- 🔄 **Advanced Automation**: Custom workflows and triggers
- 🏢 **Multi-workspace Support**: Manage multiple Linear workspaces
- 🎨 **Custom Theming**: Personalized UI themes
- ⚡ **Priority Support**: Direct email support with faster response times
- 🔐 **Enterprise SSO**: Single sign-on integration
- 📈 **Advanced Reporting**: Comprehensive reports and exports
- 🤖 **Custom AI Models**: Use your own AI models for summarization

**License:** Commercial (LICENSE.pro)  
**Cost:** Subscription-based (pricing TBD)  
**Source Code:** Visible for transparency, but requires license to use  
**Evaluation Period:** 30 days free trial  

## 💰 Pricing (Planned)

### Personal License
- **$5-10/month** or **$50-100/year**
- For individual developers
- All Pro features
- Single user

### Team License
- **$15-25/user/month** or **$150-250/user/year**
- For organizations and teams
- All Pro features
- Priority support
- Team analytics
- Centralized license management

### Enterprise License
- **Custom pricing**
- Everything in Team License
- SSO integration
- Custom AI model support
- On-premise deployment options
- Dedicated support

## 🔐 How Licensing Works

### For Free Users
1. Install the extension
2. Configure your Linear API key
3. Use all free features immediately
4. No license key required

### For Pro Users
1. Purchase a license at [licensing platform URL]
2. Receive license key via email
3. In VS Code: `Command Palette` → `Linear Buddy: Activate Pro License`
4. Enter your license key
5. Pro features unlock automatically

### License Validation
- License keys are validated against our secure backend
- Keys are tied to your email address
- Use on multiple devices with same email
- Offline grace period: 7 days
- License status checked periodically

## 🤝 Why This Model?

### For Users
- **Try before you buy**: Full 30-day trial of Pro features
- **Transparent**: Source code is visible for security review
- **Fair pricing**: Pay only for advanced features you use
- **Forever free core**: Essential features always available

### For the Project
- **Sustainable development**: Revenue supports ongoing development
- **Open source benefits**: Community contributions and transparency
- **Security**: Public code review helps identify issues
- **Growth**: Funds advanced feature development

## 🛠 For Developers & Contributors

### Contributing to Core Features
- Contributions to MIT-licensed features are welcomed
- Standard MIT license applies
- No CLA required for core features

### Contributing to Pro Features
- Contributions to Pro features require a CLA
- You retain right to use your contribution under MIT
- Helps us maintain commercial licensing

### Building from Source
- You can build and run the extension from source
- Free features work immediately
- Pro features require a license key even when built from source
- This is enforced through runtime license validation

## 📜 Legal Details

### What You CAN Do (Free Features)
- ✅ Use commercially
- ✅ Modify and distribute
- ✅ Private use
- ✅ Sublicense
- ✅ Include in commercial products

### What You CANNOT Do (Pro Features)
- ❌ Use Pro features without a license
- ❌ Remove license validation
- ❌ Circumvent licensing mechanism
- ❌ Share license keys
- ❌ Create derivative works that bypass licensing

## 🔄 Migration Path

We will **never take away features** that are currently free. If a feature is free today, it will remain free. New Pro features will be clearly marked as such.

## 📞 Support & Contact

### Free Users
- GitHub Issues for bugs and feature requests
- Community Discord (if available)
- Documentation and guides

### Pro Users
- All free user channels
- Priority email support: angelo@cooked.mx
- Faster response times
- Direct feature influence

## 🎯 Roadmap

### Phase 1: Current (Q1 2025)
- ✅ Release core features under MIT
- ✅ Establish licensing structure
- 🔄 Set up licensing backend

### Phase 2: Pro Launch (Q2 2025)
- 🔮 First Pro features
- 💳 Payment integration
- 📊 License management portal

### Phase 3: Growth (Q3-Q4 2025)
- 🏢 Enterprise features
- 🎨 Advanced customization
- 📈 Analytics and insights

## ❓ FAQ

**Q: Will core features remain free?**  
A: Yes, absolutely. Features that are free today will remain free forever.

**Q: Can I use Pro features if I contribute code?**  
A: Contributors get free Pro licenses as a thank you!

**Q: What if I can't afford Pro?**  
A: We offer free Pro licenses for students, open-source maintainers, and non-profits. Contact angelo@cooked.mx!

**Q: Can I see the Pro feature code?**  
A: Yes, it's all in the repository for transparency and security review.

**Q: Why not just close-source the Pro features?**  
A: Transparency builds trust. You can audit the code for security and privacy.

**Q: How long is the free trial?**  
A: 30 days for all Pro features, no credit card required.

**Q: Can I run both free and Pro on different machines?**  
A: Yes! Your license works on all your devices.

## 📝 Updates

This licensing model may evolve based on community feedback and project needs. We'll always:
- Give plenty of notice before changes
- Grandfather existing users
- Listen to community feedback
- Maintain transparency

---

**Last Updated:** November 7, 2025  
**Version:** 1.0  
**Questions?** Open an issue or email angelo@cooked.mx

