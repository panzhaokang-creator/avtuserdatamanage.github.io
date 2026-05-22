/**
 * Main Entry Point
 * 智能设备管理平台 - Application Bootstrap
 */

// ============================================================
// 1. Application State
// ============================================================
const APP_STATE = {
  initialized: false,
  user: null,
  config: {
    apiBaseUrl: '/api',
    appName: '智能设备管理平台',
    version: '1.0.0',
  },
};

// ============================================================
// 2. DOM References
// ============================================================
const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

const dom = {
  app: $('#app'),
  loading: $('#app-loading'),
};

// ============================================================
// 3. Utility Functions
// ============================================================
const utils = {
  /**
   * Safe JSON parse with fallback
   */
  safeParse(json, fallback = null) {
    try {
      return JSON.parse(json);
    } catch {
      return fallback;
    }
  },

  /**
   * Debounce function for performance
   */
  debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  /**
   * Format timestamp to locale string
   */
  formatDate(timestamp, locale = 'zh-CN') {
    return new Date(timestamp).toLocaleString(locale);
  },

  /**
   * Generate unique ID
   */
  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  },
};

// ============================================================
// 4. Router (Simple SPA Router)
// ============================================================
class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this._bindEvents();
  }

  register(path, handler) {
    this.routes.set(path, handler);
    return this;
  }

  navigate(path, data = {}) {
    if (this.currentRoute === path) return;
    history.pushState(data, '', path);
    this._resolve(path);
  }

  _resolve(path) {
    const handler = this.routes.get(path) || this.routes.get('*');
    if (handler) {
      this.currentRoute = path;
      handler();
    }
  }

  _bindEvents() {
    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
      this._resolve(location.pathname);
    });

    // Intercept all anchor clicks for SPA navigation
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="/"]');
      if (link && link.target !== '_blank') {
        e.preventDefault();
        this.navigate(link.getAttribute('href'));
      }
    });
  }

  start() {
    this._resolve(location.pathname);
  }
}

// ============================================================
// 5. Component System (Lightweight)
// ============================================================
const Component = {
  /**
   * Create an element with attributes and children
   */
  create(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);

    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'className') {
        el.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(el.style, value);
      } else if (key.startsWith('on') && typeof value === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (key === 'dataset' && typeof value === 'object') {
        Object.assign(el.dataset, value);
      } else {
        el.setAttribute(key, value);
      }
    }

    for (const child of children) {
      if (child == null) continue;
      if (typeof child === 'string' || typeof child === 'number') {
        el.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        el.appendChild(child);
      } else if (Array.isArray(child)) {
        el.append(...child.filter(Boolean));
      }
    }

    return el;
  },

  /**
   * Render HTML string safely
   */
  html(strings, ...values) {
    return strings.reduce((result, str, i) => {
      const val = values[i] ?? '';
      const escaped = String(val)
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#39;');
      return result + str + escaped;
    }, '');
  },
};

// ============================================================
// 6. Page Views
// ============================================================
const Pages = {
  home: {
    render() {
      const app = dom.app;
      app.innerHTML = '';

      const header = Component.create('header', { className: 'app-header' },
        Component.create('h1', {}, APP_STATE.config.appName),
        Component.create('p', { className: 'subtitle' }, '便捷连接、配置和管理您的智能设备'),
      );

      const features = Component.create('section', { className: 'features' },
        Component.create('div', { className: 'feature-card', dataset: { page: 'device' } },
          Component.create('div', { className: 'feature-icon' }, '📱'),
          Component.create('h3', {}, '设备管理'),
          Component.create('p', {}, '查看和管理您的智能设备列表'),
        ),
        Component.create('div', { className: 'feature-card', dataset: { page: 'config' } },
          Component.create('div', { className: 'feature-icon' }, '🔧'),
          Component.create('h3', {}, '网络配置'),
          Component.create('p', {}, '通过蓝牙配置设备网络连接'),
        ),
        Component.create('div', { className: 'feature-card', dataset: { page: 'data' } },
          Component.create('div', { className: 'feature-icon' }, '📊'),
          Component.create('h3', {}, '数据查看'),
          Component.create('p', {}, '查看设备运行数据和日志'),
        ),
        Component.create('div', { className: 'feature-card', dataset: { page: 'profile' } },
          Component.create('div', { className: 'feature-icon' }, '👤'),
          Component.create('h3', {}, '个人中心'),
          Component.create('p', {}, '管理您的账户和设置'),
        ),
      );

      // Feature card click navigation
      features.addEventListener('click', (e) => {
        const card = e.target.closest('.feature-card');
        if (card) {
          const page = card.dataset.page;
          router.navigate(`/${page}`);
        }
      });

      app.append(header, features);
    },
  },

  device: {
    render() {
      const app = dom.app;
      app.innerHTML = Component.html`
        <div class="page">
          <header class="page-header">
            <button class="btn-back" onclick="history.back()">← 返回</button>
            <h2>设备管理</h2>
          </header>
          <div class="page-content">
            <p class="placeholder">设备列表加载中...</p>
          </div>
        </div>
      `;
    },
  },

  config: {
    render() {
      const app = dom.app;
      app.innerHTML = Component.html`
        <div class="page">
          <header class="page-header">
            <button class="btn-back" onclick="history.back()">← 返回</button>
            <h2>网络配置</h2>
          </header>
          <div class="page-content">
            <p class="placeholder">通过蓝牙配置设备网络</p>
          </div>
        </div>
      `;
    },
  },

  data: {
    render() {
      const app = dom.app;
      app.innerHTML = Component.html`
        <div class="page">
          <header class="page-header">
            <button class="btn-back" onclick="history.back()">← 返回</button>
            <h2>数据查看</h2>
          </header>
          <div class="page-content">
            <p class="placeholder">设备运行数据和日志</p>
          </div>
        </div>
      `;
    },
  },

  profile: {
    render() {
      const app = dom.app;
      app.innerHTML = Component.html`
        <div class="page">
          <header class="page-header">
            <button class="btn-back" onclick="history.back()">← 返回</button>
            <h2>个人中心</h2>
          </header>
          <div class="page-content">
            <p class="placeholder">账户和设置管理</p>
          </div>
        </div>
      `;
    },
  },

  notFound: {
    render() {
      const app = dom.app;
      app.innerHTML = Component.html`
        <div class="page page-center">
          <h1>404</h1>
          <p>页面未找到</p>
          <a href="/" class="btn-primary">返回首页</a>
        </div>
      `;
    },
  },
};

// ============================================================
// 7. Initialize Router
// ============================================================
const router = new Router();

router
  .register('/', () => Pages.home.render())
  .register('/device', () => Pages.device.render())
  .register('/config', () => Pages.config.render())
  .register('/data', () => Pages.data.render())
  .register('/profile', () => Pages.profile.render())
  .register('*', () => Pages.notFound.render());

// ============================================================
// 8. Inject Page Styles
// ============================================================
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* App Header */
    .app-header {
      text-align: center;
      padding: 48px 20px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
    }
    .app-header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .app-header .subtitle {
      font-size: 14px;
      opacity: 0.85;
    }

    /* Features Grid */
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
      padding: 24px 16px;
      max-width: 800px;
      margin: 0 auto;
    }
    .feature-card {
      background: #fff;
      border-radius: 12px;
      padding: 24px 16px;
      text-align: center;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.1);
    }
    .feature-card:active {
      transform: translateY(-1px);
    }
    .feature-icon {
      font-size: 36px;
      margin-bottom: 12px;
    }
    .feature-card h3 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 6px;
      color: #333;
    }
    .feature-card p {
      font-size: 13px;
      color: #999;
      line-height: 1.4;
    }

    /* Page Layout */
    .page {
      min-height: 100vh;
      background: #f5f7fa;
    }
    .page-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 16px;
    }
    .page-center h1 {
      font-size: 72px;
      color: #ddd;
    }
    .page-center p {
      font-size: 16px;
      color: #999;
    }

    .page-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      background: #fff;
      border-bottom: 1px solid #eee;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .page-header h2 {
      font-size: 18px;
      font-weight: 600;
    }

    .btn-back {
      background: none;
      border: none;
      font-size: 16px;
      color: #2979ff;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .btn-back:hover {
      background: rgba(41,121,255,0.08);
    }

    .btn-primary {
      display: inline-block;
      padding: 10px 24px;
      background: #2979ff;
      color: #fff;
      border-radius: 8px;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: background 0.2s;
    }
    .btn-primary:hover {
      background: #1565c0;
    }

    .page-content {
      padding: 24px 20px;
    }
    .placeholder {
      text-align: center;
      color: #bbb;
      padding: 48px 0;
      font-size: 15px;
    }

    /* Responsive */
    @media (max-width: 480px) {
      .app-header {
        padding: 36px 16px 24px;
      }
      .app-header h1 {
        font-size: 24px;
      }
      .features {
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        padding: 16px 12px;
      }
      .feature-card {
        padding: 20px 12px;
      }
      .feature-icon {
        font-size: 28px;
      }
    }
  `;
  document.head.appendChild(style);
}

// ============================================================
// 9. Bootstrap Application
// ============================================================
function bootstrap() {
  // Inject page styles
  injectStyles();

  // Start the router
  router.start();

  // Mark as initialized
  APP_STATE.initialized = true;

  // Dispatch ready event
  window.dispatchEvent(new CustomEvent('app-ready', { detail: APP_STATE }));

  console.log(`[${APP_STATE.config.appName}] v${APP_STATE.config.version} initialized`);
}

// ============================================================
// 10. Start Application
// ============================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
