import { Link } from 'react-router-dom'
import { ArrowRight, Zap, BarChart3, Brain, ShieldCheck, Users, Play, Send, Shield, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function Landing() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const stats = [
    { num: '85%', label: 'Churn Reduction', icon: <TrendingUp className="w-10 h-10" /> },
    { num: '97%', label: 'Prediction Accuracy', icon: <ShieldCheck className="w-10 h-10" /> },
    { num: '12K+', label: 'Customers Analyzed', icon: <Users className="w-10 h-10" /> },
  ]

  const features = [
    {
      title: 'AI-Powered Churn Prediction',
      desc: 'Machine learning models trained on 7K+ telecom customers. Get churn probability, confidence score, and feature importance.',
      icon: <Brain className="w-14 h-14 text-primary opacity-80" />,
    },
    {
      title: 'Real-Time Analytics',
      desc: 'Interactive dashboards with churn trends, contract analysis, feature importance charts, and prediction history.',
      icon: <BarChart3 className="w-14 h-14 text-accent opacity-80" />,
    },
    {
      title: 'Secure & Private',
      desc: 'JWT authentication, encrypted predictions, GDPR compliant. Your customer data never leaves your browser.',
      icon: <Shield className="w-14 h-14 text-success opacity-80" />,
    },
    {
      title: 'Instant Insights',
      desc: 'Get actionable insights instantly. Know exactly which factors drive churn for each customer.',
      icon: <Zap className="w-14 h-14 text-warning opacity-80" />,
    },
  ]

  const steps = [
    {
      num: '01',
      title: 'Enter Customer Data',
      desc: 'Fill 19 demographic, service, and billing features. Takes 30 seconds.',
      icon: '📋',
    },
    {
      num: '02',
      title: 'AI Analysis',
      desc: 'Our tuned Random Forest model analyzes risk factors and predicts churn probability.',
      icon: '🤖',
    },
    {
      num: '03',
      title: 'Get Insights',
      desc: 'View prediction, confidence score, feature importance chart, and retention recommendations.',
      icon: '📊',
    },
  ]

  const testimonials = [
    {
      quote: '“Reduced our churn by 23% in 3 months. The feature importance charts helped us target month-to-month contract holders.”',
      author: 'Sarah Chen, Retention Director',
      company: 'TelecomCo',
      avatar: 'SC',
    },
    {
      quote: '“Best ROI of any SaaS tool we use. Predictions are 97% accurate and explainable.”',
      author: 'Mark Rivera, Data Lead',
      company: 'Connectify',
      avatar: 'MR',
    },
    {
      quote: '“Lightning fast predictions with beautiful dashboards. Team loves the UX.”',
      author: 'Priya Patel, Product Manager',
      company: 'NextWave Wireless',
      avatar: 'PP',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* ── Navbar ── */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hidden md:block">
            ChurnPredictor
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/#features" className="nav-item text-sm hidden md:block">Features</Link>
          <Link to="/#how-it-works" className="nav-item text-sm hidden md:block">How it Works</Link>
          <Link to="/#pricing" className="nav-item text-sm hidden md:block">Pricing</Link>
          <Link to="/login" className="btn-secondary text-sm px-4 py-1.5 hidden lg:block">
            Login
          </Link>
          <Link to="/register" className="btn-primary text-sm px-6 py-1.5">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-section pt-[68px] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center py-20">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Powered by AI</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight bg-gradient-to-r from-gray-100 via-primary to-accent bg-clip-text text-transparent">
                Predict Customer Churn
                <span className="block text-4xl md:text-5xl lg:text-6xl mt-4">Before It Happens</span>
              </h1>
              <p className="text-xl text-muted max-w-2xl leading-relaxed">
                Leverage cutting-edge machine learning to identify at-risk customers and boost retention. 
                <span className="font-semibold text-primary">97% accurate predictions</span> in seconds.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  to="/register"
                  className="btn-primary text-lg px-8 py-4 shadow-2xl hover:shadow-primary/25 flex items-center gap-3 w-full sm:w-auto"
                >
                  Start Free Trial
                  <ArrowRight size={20} />
                </Link>
                <Link to="/login" className="btn-secondary text-lg px-8 py-4 flex items-center gap-3 w-full sm:w-auto">
                  View Demo
                  <Play size={20} />
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-6 pt-8">
                {stats.map((stat, i) => (
                  <div key={i} className="stat-pill text-center py-3">
                    <div className="text-2xl font-bold text-primary font-mono">{stat.num}</div>
                    <div className="text-xs text-muted mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-gradient-to-br from-primary/10 to-accent/5 rounded-full animate-heroFloat blur-3xl opacity-70" />
              <div className="relative bg-gradient-to-br from-bg-card to-bg-elevated rounded-3xl p-8 shadow-2xl border border-border/50 backdrop-blur-sm">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="w-full h-32 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
                      <BarChart3 size={32} className="text-primary opacity-60" />
                    </div>
                    <div className="text-sm text-muted">Churn Rate</div>
                    <div className="text-2xl font-bold gradient-text">18.4%</div>
                  </div>
                  <div className="space-y-3">
                    <div className="w-full h-32 bg-gradient-to-r from-success/20 to-emerald/20 rounded-xl flex items-center justify-center">
                      <TrendingUp size={32} className="text-success" />
                    </div>
                    <div className="text-sm text-muted">Retention Lift</div>
                    <div className="text-2xl font-bold text-success">+23%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Orbs */}
        <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-gradient-to-br from-primary/20 rounded-full animate-orb1 blur-xl opacity-40" style={{ animationDuration: '12s' }} />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-accent/20 to-cyan/10 rounded-full animate-orb2 blur-xl opacity-40" style={{ animationDuration: '16s' }} />
        <div className="absolute bottom-1/4 left-1/2 w-56 h-56 bg-gradient-to-br from-success/15 rounded-full animate-orb3 blur-xl opacity-40" style={{ animationDuration: '20s' }} />
      </section>

      {/* ── Features ── */}
      <section id="features" className="landing-section -mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-6">
              Everything You Need
            </h2>
            <p className="text-xl text-muted max-w-3xl mx-auto leading-relaxed">
              Predict, analyze, and prevent churn with the most advanced AI platform built for customer retention.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="feature-card group p-8 hover:-translate-y-2 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-primary mb-4">{feature.title}</h3>
                <p className="text-muted leading-relaxed text-lg">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section id="how-it-works" className="landing-section bg-bg-surface/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Simple. Fast. Accurate.</h2>
            <p className="text-xl text-muted max-w-2xl mx-auto">3 steps to churn prediction and retention insights</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 items-start">
            {steps.map((step, i) => (
              <div key={i} className="step-card text-center group hover:-translate-y-3">
                <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent mx-auto mb-6 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg">
                  {step.icon}
                </div>
                <div className="w-1 h-12 bg-gradient-to-b from-primary to-accent mx-auto mb-6 opacity-50 group-hover:opacity-100 transition-opacity" />
                <h3 className="text-xl font-bold mb-4 text-primary">{step.title}</h3>
                <p className="text-muted leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-section py-24 bg-gradient-to-b from-primary/5 to-accent/5">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-6">
            Ready to Reduce Churn?
          </h2>
          <p className="text-xl text-muted mb-12 max-w-2xl mx-auto leading-relaxed">
            Join 500+ teams using ChurnPredictor to save millions in customer acquisition costs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary text-xl px-12 py-5 shadow-2xl">
              Start Free Trial
            </Link>
            <Link to="/demo" className="btn-secondary text-xl px-12 py-5">
              Book Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
                  <Zap size={18} className="text-white" />
                </div>
                <span className="font-bold text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  ChurnPredictor
                </span>
              </div>
              <p className="text-muted mb-6 leading-relaxed">AI-powered customer churn prediction and retention analytics.</p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-bg-card rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                  <Send size={16} />
                </a>
                <a href="#" className="w-10 h-10 bg-bg-card rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                  <Users size={16} />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-6 text-primary">Product</h4>
              <ul className="space-y-2 text-muted text-sm">
                <li><a href="/#features" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="/#how-it-works" className="hover:text-primary transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-6 text-primary">Company</h4>
              <ul className="space-y-2 text-muted text-sm">
                <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-6 text-primary">Legal</h4>
              <ul className="space-y-2 text-muted text-sm">
                <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
              </ul>
              <div className="mt-8 pt-8 border-t border-border">
                <Link to="/login" className="btn-secondary text-sm px-6 py-2">
                  Sign In →
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-muted text-sm">
            © 2026 ChurnPredictor. All rights reserved. Made with ❤️ for retention teams.
          </div>
        </div>
      </footer>
    </div>
  )
}

