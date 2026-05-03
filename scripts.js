// scripts.js
// Paste this as your full client script.
// If you are using Firebase Hosting + Firestore, replace the firebaseConfig values below.
// For email notifications to the host, set up a Firestore-triggered Cloud Function
// or the Trigger Email extension. The browser script should only save RSVP data.

import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================
   Firebase config
   =========================
   Replace these with your Firebase project settings.
*/
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Avoid native validation popups so the custom UX can stay premium.
  const form = document.querySelector(".rsvp__form");
  const nameInput = document.querySelector("#guestName");
  const attendanceInput = document.querySelector("#attendance");
  const submitButton = form?.querySelector('button[type="submit"]');

  if (form) form.noValidate = true;

  // -----------------------------
  // Scroll reveal
  // -----------------------------
  const revealItems = document.querySelectorAll(".reveal");
  if (!prefersReducedMotion && revealItems.length) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -80px 0px" }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  // -----------------------------
  // Smooth scroll for local links
  // -----------------------------
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
    });
  });

  // -----------------------------
  // Hero parallax / float
  // -----------------------------
  const hero = document.querySelector(".hero");
  const heroMedia = document.querySelector(".hero__media");
  const heroTitle = document.querySelector(".hero__title");
  let rafId = null;
  let mouseX = 0;
  let mouseY = 0;

  function animateHero() {
    rafId = null;
    if (!hero || !heroMedia) return;

    const rect = hero.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const dx = (mouseX - centerX) / rect.width;
    const dy = (mouseY - centerY) / rect.height;

    heroMedia.style.transform = `translate3d(${dx * 16}px, ${dy * 12}px, 0)`;
    if (heroTitle) heroTitle.style.transform = `translate3d(${dx * -6}px, ${dy * -5}px, 0)`;
  }

  if (hero && !prefersReducedMotion) {
    hero.addEventListener("mousemove", (e) => {
      const rect = hero.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;

      if (!rafId) rafId = requestAnimationFrame(animateHero);
    });

    hero.addEventListener("mouseleave", () => {
      if (heroMedia) heroMedia.style.transform = "translate3d(0,0,0)";
      if (heroTitle) heroTitle.style.transform = "translate3d(0,0,0)";
    });
  }

  // -----------------------------
  // Ambient floating particles
  // -----------------------------
  const glowLayer = document.querySelector(".bg-layer--glow");
  if (glowLayer && !prefersReducedMotion) {
    const particleCount = 16;

    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement("span");
      const size = 2 + Math.random() * 4;
      p.style.position = "absolute";
      p.style.left = `${Math.random() * 100}%`;
      p.style.top = `${Math.random() * 100}%`;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.borderRadius = "999px";
      p.style.pointerEvents = "none";
      p.style.opacity = `${0.18 + Math.random() * 0.55}`;
      p.style.background = "rgba(242, 211, 123, 0.9)";
      p.style.boxShadow = "0 0 16px rgba(242, 211, 123, 0.18)";
      p.style.animation = `floatParticle ${10 + Math.random() * 14}s ease-in-out ${Math.random() * 6}s infinite alternate`;

      glowLayer.appendChild(p);
    }

    if (!document.getElementById("floatParticleStyles")) {
      const style = document.createElement("style");
      style.id = "floatParticleStyles";
      style.textContent = `
        @keyframes floatParticle {
          0%   { transform: translate3d(0, 0, 0) scale(1); }
          100% { transform: translate3d(${18 + Math.random() * 30}px, ${-18 + Math.random() * 36}px, 0) scale(1.12); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // -----------------------------
  // Toast helper
  // -----------------------------
  function showToast(message, kind = "default") {
    const existing = document.querySelector(".toast-message");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = `toast-message toast-message--${kind}`;
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.innerHTML = `
      <span class="toast-message__icon">${kind === "error" ? "!" : "✓"}</span>
      <span class="toast-message__text">${message}</span>
    `;

    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("show"));

    setTimeout(() => {
      toast.classList.remove("show");
      toast.classList.add("hide");
      setTimeout(() => toast.remove(), 260);
    }, 2400);
  }

  // -----------------------------
  // RSVP submit -> Firestore
  // Only redirects to success.html when attending is checked.
  // -----------------------------
  if (form && nameInput && attendanceInput) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = nameInput.value.trim();
      const attending = attendanceInput.checked;

      if (!name) {
        showToast("Please enter a name.", "error");
        nameInput.focus();
        return;
      }

      if (!attending) {
        showToast("Please confirm attendance to continue.", "error");
        attendanceInput.focus();
        return;
      }

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.dataset.originalHtml = submitButton.innerHTML;
        submitButton.innerHTML = `Saving <i class="fa-solid fa-circle-notch fa-spin"></i>`;
      }

      try {
        const docRef = await addDoc(collection(db, "rsvps"), {
          name,
          attending: true,
          event: "Joe Surprise Birthday Dinner",
          venue: "Acqua Bistecca, DC",
          address: "10 Ridge Square NW, Washington, DC 20016",
          eventDate: "2026-05-30",
          eventTime: "7:00 PM",
          createdAt: serverTimestamp(),
          userAgent: navigator.userAgent,
          source: "website"
        });

        showToast("Saved successfully.", "success");

        // Give the toast a brief moment, then move to the success page.
        setTimeout(() => {
          const params = new URLSearchParams({
            name,
            id: docRef.id
          });

          window.location.href = `success.html?${params.toString()}`;
        }, 700);
      } catch (error) {
        console.error("RSVP save failed:", error);
        showToast("Something went wrong. Please try again.", "error");

        if (submitButton) {
          submitButton.disabled = false;
          if (submitButton.dataset.originalHtml) {
            submitButton.innerHTML = submitButton.dataset.originalHtml;
          }
        }
      }
    });
  }

  // -----------------------------
  // Live guest list / admin support
  // Add these elements on admin.html if you want:
  // #guestList, [data-rsvp-count], [data-guest-count]
  // -----------------------------
  const guestList = document.querySelector("#guestList");
  const countEl = document.querySelector("[data-rsvp-count]");
  const attendingEl = document.querySelector("[data-guest-count]");

  if (guestList || countEl || attendingEl) {
    const rsvpQuery = query(collection(db, "rsvps"), orderBy("createdAt", "desc"));

    onSnapshot(
      rsvpQuery,
      (snapshot) => {
        const items = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({
            id: docSnap.id,
            name: data.name || "Unnamed guest",
            attending: !!data.attending,
            createdAt: data.createdAt || null
          });
        });

        if (countEl) {
          countEl.textContent = String(items.length);
        }

        if (attendingEl) {
          attendingEl.textContent = String(items.filter((item) => item.attending).length);
        }

        if (guestList) {
          guestList.innerHTML = items
            .map(
              (item) => `
                <li class="guest-row">
                  <span class="guest-row__name">${item.name}</span>
                  <span class="guest-row__status ${item.attending ? "is-going" : "is-not-going"}">
                    ${item.attending ? "Attending" : "Pending"}
                  </span>
                </li>
              `
            )
            .join("");
        }
      },
      (error) => {
        console.error("Live guest list failed:", error);
      }
    );
  }

  // -----------------------------
  // Small polish for any reveal/open buttons
  // -----------------------------
  document.querySelectorAll(".btn, .invite-card").forEach((el) => {
    el.addEventListener("click", () => {
      if (prefersReducedMotion) return;
      el.animate(
        [
          { transform: "translateY(0) scale(1)" },
          { transform: "translateY(-1px) scale(0.985)" },
          { transform: "translateY(0) scale(1)" }
        ],
        { duration: 240, easing: "ease-out" }
      );
    });
  });

  // Expose a tiny hook if you want to test from the console
  window.__rsvpApp = {
    db,
    app
  };
});
