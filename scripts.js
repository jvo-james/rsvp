// scripts.js

document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;

  // -----------------------------
  // Reveal on scroll
  // -----------------------------
  const revealItems = document.querySelectorAll(".reveal");

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -80px 0px",
    }
  );

  revealItems.forEach((item) => revealObserver.observe(item));

  // -----------------------------
  // Smooth scrolling for anchor links
  // -----------------------------
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // -----------------------------
  // Hero parallax / float effect
  // -----------------------------
  const hero = document.querySelector(".hero");
  const heroMedia = document.querySelector(".hero__media");
  const heroTitle = document.querySelector(".hero__title");

  let mouseX = 0;
  let mouseY = 0;
  let rafId = null;

  function animateHero() {
    rafId = null;

    if (!heroMedia || !hero) return;

    const rect = hero.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const deltaX = (mouseX - centerX) / rect.width;
    const deltaY = (mouseY - centerY) / rect.height;

    const mediaX = deltaX * 18;
    const mediaY = deltaY * 14;

    const titleX = deltaX * -8;
    const titleY = deltaY * -6;

    heroMedia.style.transform = `translate3d(${mediaX}px, ${mediaY}px, 0)`;
    if (heroTitle) {
      heroTitle.style.transform = `translate3d(${titleX}px, ${titleY}px, 0)`;
    }
  }

  if (hero) {
    hero.addEventListener("mousemove", (e) => {
      const rect = hero.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;

      if (!rafId) {
        rafId = requestAnimationFrame(animateHero);
      }
    });

    hero.addEventListener("mouseleave", () => {
      if (heroMedia) heroMedia.style.transform = "translate3d(0, 0, 0)";
      if (heroTitle) heroTitle.style.transform = "translate3d(0, 0, 0)";
    });
  }

  const revealBtn = document.querySelector(".btn--reveal");

if (revealBtn) {
  revealBtn.addEventListener("click", () => {
    revealBtn.classList.add("is-active");
    setTimeout(() => revealBtn.classList.remove("is-active"), 1200);
  });
}
  // -----------------------------
  // Subtle floating particles
  // -----------------------------
  const particleHost = document.querySelector(".bg-layer--glow");
  if (particleHost) {
    const particleCount = 18;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("span");
      particle.className = "floating-particle";

      const size = 2 + Math.random() * 5;
      const left = Math.random() * 100;
      const delay = Math.random() * 10;
      const duration = 10 + Math.random() * 16;
      const top = 10 + Math.random() * 80;

      particle.style.cssText = `
        position: absolute;
        left: ${left}%;
        top: ${top}%;
        width: ${size}px;
        height: ${size}px;
        border-radius: 999px;
        opacity: ${0.2 + Math.random() * 0.6};
        pointer-events: none;
        animation: floatParticle ${duration}s ease-in-out ${delay}s infinite alternate;
      `;

      particleHost.appendChild(particle);
    }

    if (!document.getElementById("particle-keyframes")) {
      const style = document.createElement("style");
      style.id = "particle-keyframes";
      style.textContent = `
        @keyframes floatParticle {
          0%   { transform: translate3d(0, 0, 0) scale(1); }
          100% { transform: translate3d(${20 + Math.random() * 40}px, ${-20 + Math.random() * 40}px, 0) scale(1.15); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // -----------------------------
  // Hero image swap pulse
  // (light enhancement if two images exist)
  // -----------------------------
  const largeHeroImg = document.querySelector(".hero__img--large");
  const smallHeroImg = document.querySelector(".hero__img--small");

  if (largeHeroImg && smallHeroImg) {
    const images = [largeHeroImg, smallHeroImg];
    let activeIndex = 0;

    setInterval(() => {
      activeIndex = (activeIndex + 1) % images.length;

      images.forEach((img, index) => {
        img.classList.toggle("is-active", index === activeIndex);
      });
    }, 6500);
  }

  // -----------------------------
  // RSVP form handling
  // -----------------------------
  const form = document.querySelector(".rsvp__form");

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.innerHTML = `
      <span class="toast-message__icon">✓</span>
      <span class="toast-message__text">${message}</span>
    `;

    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("show"));

    setTimeout(() => {
      toast.classList.remove("show");
      toast.classList.add("hide");

      setTimeout(() => toast.remove(), 350);
    }, 2800);
  }

  if (form) {
    const attendance = document.querySelector("#attendance");

    if (attendance) {
      attendance.addEventListener("change", () => {
        const card = attendance.closest(".check-card");
        if (card) card.classList.toggle("is-checked", attendance.checked);
      });
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const nameInput = document.querySelector("#guestName");
      const name = nameInput ? nameInput.value.trim() : "";
      const attending = attendance ? attendance.checked : false;

      if (!name) {
        showToast("Please enter your name.");
        nameInput?.focus();
        return;
      }

      if (!attending) {
        showToast("Please confirm attendance.");
        attendance?.focus();
        return;
      }

      // Replace this with your backend / form service later
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn ? btn.innerHTML : "";

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `Confirmed <i class="fa-solid fa-check"></i>`;
      }

      showToast(`Thank you, ${name}. Your response is saved.`);

      form.reset();

      const checkCard = document.querySelector(".check-card");
      if (checkCard) checkCard.classList.remove("is-checked");

      setTimeout(() => {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
      }, 1800);
    });
  }

  // -----------------------------
  // Dynamic backdrop shimmer
  // -----------------------------
  const glowLayer = document.querySelector(".bg-layer--glow");
  if (glowLayer) {
    let glowX = 50;
    let glowY = 35;
    let targetGlowX = glowX;
    let targetGlowY = glowY;

    window.addEventListener("mousemove", (e) => {
      targetGlowX = (e.clientX / window.innerWidth) * 100;
      targetGlowY = (e.clientY / window.innerHeight) * 100;
    });

    const glowTick = () => {
      glowX += (targetGlowX - glowX) * 0.03;
      glowY += (targetGlowY - glowY) * 0.03;

      glowLayer.style.background = `
        radial-gradient(circle at ${glowX}% ${glowY}%,
          rgba(242, 211, 123, 0.14),
          rgba(214, 177, 90, 0.07) 20%,
          rgba(0, 0, 0, 0) 45%)
      `;

      requestAnimationFrame(glowTick);
    };

    glowTick();
  }

  // -----------------------------
  // Tiny helper to make SVG ornaments feel alive
  // -----------------------------
  const ornaments = document.querySelectorAll(".ornament, .venue__svg, .hero__rays");
  ornaments.forEach((el, index) => {
    el.style.willChange = "transform";
    el.animate(
      [
        { transform: "translate3d(0, 0, 0) rotate(0deg)" },
        { transform: `translate3d(${index % 2 === 0 ? 6 : -6}px, ${index % 2 === 0 ? -8 : 8}px, 0) rotate(${index % 2 === 0 ? 1 : -1}deg)` },
        { transform: "translate3d(0, 0, 0) rotate(0deg)" },
      ],
      {
        duration: 7000 + index * 500,
        iterations: Infinity,
        easing: "ease-in-out",
      }
    );
  });

  // -----------------------------
  // Support reduced motion
  // -----------------------------
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    document.documentElement.style.scrollBehavior = "auto";
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  // Small polish
  body.classList.add("js-ready");
});
