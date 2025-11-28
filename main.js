// main.js

// Menú móvil
const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.site-nav');

if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// --------- FUNCIONES DE ENHANCEMENT POR PÁGINA ---------

let revealObserver;

function initRevealAnimations() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (revealObserver) {
    revealObserver.disconnect();
  }

  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const revealElements = document.querySelectorAll('.reveal');

    revealObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => {
      el.classList.add('is-visible');
    });
  }
}

function updateActiveNav(url) {
  const links = document.querySelectorAll('.site-nav a');
  links.forEach(link => {
    link.classList.toggle('active', link.href === url);
  });
}

function initPageEnhancements() {
  initRevealAnimations();
  updateActiveNav(window.location.href);
}

initPageEnhancements();

// --------- ROUTER LIGERO PARA NAVEGACIÓN SIN PARPADEO ---------

const mainEl = document.querySelector('main');

async function navigateTo(url, { addToHistory = true } = {}) {
  if (!mainEl) return;

  try {
    mainEl.classList.remove('page-transition-in');
    mainEl.classList.add('page-transition-out');

    const res = await fetch(url, {
      headers: {
        'X-Requested-With': 'sykra-router'
      }
    });

    if (!res.ok) {
      window.location.href = url;
      return;
    }

    const htmlText = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    const newMain = doc.querySelector('main');
    const newTitle = doc.querySelector('title');

    if (!newMain) {
      window.location.href = url;
      return;
    }

    mainEl.innerHTML = newMain.innerHTML;

    if (newTitle) {
      document.title = newTitle.textContent;
    }

    if (addToHistory) {
      window.history.pushState({}, '', url);
    }

    initPageEnhancements();

    window.scrollTo(0, 0);

    mainEl.offsetHeight;
    mainEl.classList.remove('page-transition-out');
    mainEl.classList.add('page-transition-in');
  } catch (error) {
    window.location.href = url;
  }
}

// Interceptar clics en enlaces internos
document.addEventListener('click', event => {
  const anchor = event.target.closest('a');
  if (!anchor) return;

  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  const url = new URL(anchor.href, window.location.origin);

  if (
    url.origin !== window.location.origin ||
    anchor.target === '_blank' ||
    url.pathname === window.location.pathname && url.hash
  ) {
    return;
  }

  event.preventDefault();
  navigateTo(url.href);
});

window.addEventListener('popstate', () => {
  navigateTo(window.location.href, { addToHistory: false });
});
