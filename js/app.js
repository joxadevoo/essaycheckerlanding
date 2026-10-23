/**
 * Main Application Logic for Landing Page
 * UI Interactions, FAQ Accordion, Mobile Menu, Toast Alerts
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Sticky Navbar on Scroll
  const navbar = document.querySelector(".navbar");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 40) {
      navbar.style.background = "rgba(9, 13, 22, 0.95)";
      navbar.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.5)";
    } else {
      navbar.style.background = "rgba(9, 13, 22, 0.75)";
      navbar.style.boxShadow = "none";
    }
  });

  // 2. Mobile Nav Toggle
  const mobileToggle = document.querySelector(".mobile-nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const isActive = navLinks.classList.toggle("active");
      mobileToggle.classList.toggle("active", isActive);
      mobileToggle.setAttribute("aria-expanded", isActive ? "true" : "false");
    });

    // Close when clicking any nav link
    navLinks.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("active");
        mobileToggle.classList.remove("active");
        mobileToggle.setAttribute("aria-expanded", "false");
      });
    });

    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (!navLinks.contains(e.target) && !mobileToggle.contains(e.target) && navLinks.classList.contains("active")) {
        navLinks.classList.remove("active");
        mobileToggle.classList.remove("active");
        mobileToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // 3. FAQ Accordion
  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach(item => {
    const question = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");

    if (question && answer) {
      question.addEventListener("click", () => {
        const isActive = item.classList.contains("active");

        // Close other items
        faqItems.forEach(otherItem => {
          otherItem.classList.remove("active");
          const otherAnswer = otherItem.querySelector(".faq-answer");
          if (otherAnswer) otherAnswer.style.maxHeight = null;
        });

        if (!isActive) {
          item.classList.add("active");
          answer.style.maxHeight = answer.scrollHeight + "px";
        }
      });
    }
  });

  // Open first FAQ item by default
  if (faqItems.length > 0) {
    const firstItem = faqItems[0];
    const firstAnswer = firstItem.querySelector(".faq-answer");
    firstItem.classList.add("active");
    if (firstAnswer) firstAnswer.style.maxHeight = firstAnswer.scrollHeight + "px";
  }

  // 4. Smooth Anchor Link Scrolling
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function(e) {
      const targetId = this.getAttribute("href");
      if (targetId && targetId !== "#") {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({
            behavior: "smooth"
          });
          // Close mobile menu if open
          if (navLinks && window.innerWidth <= 768) {
            navLinks.style.display = "none";
          }
        }
      }
    });
  });

  // 5. Toast Notification Helper
  window.showToast = function(message) {
    let toast = document.getElementById("appToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "appToast";
      toast.style.position = "fixed";
      toast.style.bottom = "24px";
      toast.style.right = "24px";
      toast.style.background = "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)";
      toast.style.color = "#ffffff";
      toast.style.padding = "0.85rem 1.5rem";
      toast.style.borderRadius = "12px";
      toast.style.boxShadow = "0 10px 30px rgba(0,0,0,0.4)";
      toast.style.fontWeight = "600";
      toast.style.zIndex = "9999";
      toast.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
      toast.style.opacity = "0";
      toast.style.transform = "translateY(20px)";
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(20px)";
    }, 3200);
  };
});
