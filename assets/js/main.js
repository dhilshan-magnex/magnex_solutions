(function () {
  "use strict";

  const nav = document.querySelector(".nav");
  const hamburger = document.querySelector(".nav__hamburger");
  const mobileMenu = document.querySelector(".nav__mobile");
  // Scrolled class
  function handleNavScroll() {
    if (!nav) return;
    if (window.scrollY > 30) {
      nav.classList.add("scrolled");
    } else {
      nav.classList.remove("scrolled");
    }
  }

  window.addEventListener("scroll", handleNavScroll, { passive: true });
  handleNavScroll();

  // Mobile menu toggle
  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", () => {
      const isOpen = hamburger.classList.toggle("open");
      mobileMenu.classList.toggle("open", isOpen);
      document.body.style.overflow = isOpen ? "hidden" : "";
    });

    // Close on link click
    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        hamburger.classList.remove("open");
        mobileMenu.classList.remove("open");
        document.body.style.overflow = "";
      });
    });
  }

  // Active nav link
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav__link").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === currentPage || (currentPage === "" && href === "index.html")) {
      link.classList.add("active");
    }
  });

  const reveals = document.querySelectorAll(".reveal");

  if (reveals.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            // Stagger children if inside a grid
            const delay = entry.target.dataset.delay || 0;
            setTimeout(() => {
              entry.target.classList.add("revealed");
            }, delay);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    reveals.forEach((el, i) => {
      // Auto-stagger siblings in grids
      const parent = el.parentElement;
      if (
        parent &&
        (parent.classList.contains("grid-2") ||
          parent.classList.contains("grid-3") ||
          parent.classList.contains("grid-4"))
      ) {
        const siblings = Array.from(parent.children);
        const index = siblings.indexOf(el);
        el.dataset.delay = index * 80;
      }
      observer.observe(el);
    });
  } else {
    // Fallback: just show all
    reveals.forEach((el) => el.classList.add("revealed"));
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const target = document.querySelector(anchor.getAttribute("href"));
      if (target) {
        e.preventDefault();
        const offset =
          parseInt(
            getComputedStyle(document.documentElement).getPropertyValue(
              "--nav-height",
            ),
          ) || 72;
        const top =
          target.getBoundingClientRect().top + window.scrollY - offset - 16;
        window.scrollTo({ top, behavior: "smooth" });
      }
    });
  });

  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      tabBtns.forEach((b) => b.classList.remove("active"));
      tabPanels.forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const panel = document.getElementById(target);
      if (panel) panel.classList.add("active");
    });
  });

  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      let valid = true;

      // Clear previous errors
      contactForm.querySelectorAll(".form-group").forEach((g) => {
        g.classList.remove("error");
        const err = g.querySelector(".form-error");
        if (err) err.classList.remove("visible");
      });

      // Validate name
      const nameField = contactForm.querySelector("#name");
      if (nameField && nameField.value.trim().length < 2) {
        showError(nameField, "Please enter your full name.");
        valid = false;
      }

      // Validate email
      const emailField = contactForm.querySelector("#email");
      if (emailField) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailField.value.trim())) {
          showError(emailField, "Please enter a valid email address.");
          valid = false;
        }
      }

      // Validate message
      const msgField = contactForm.querySelector("#message");
      if (msgField && msgField.value.trim().length < 10) {
        showError(msgField, "Please enter a message (at least 10 characters).");
        valid = false;
      }

      if (valid) {
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Sending...";
        submitBtn.disabled = true;

        const formData = new FormData(contactForm);
        const endpoint = contactForm.dataset.endpoint;

        if (endpoint && window.location.protocol !== "file:") {
          fetch(endpoint, {
            method: "POST",
            body: formData,
            headers: { Accept: "application/json" },
          })
            .then((response) => parseJsonResponse(response))
            .then(({ ok, data }) => {
              if (!ok || !data.success) {
                throw new Error(data.message || "Unable to send message.");
              }

              contactForm.reset();
              showSuccess(
                "Message sent successfully!",
                "A Magnex specialist will reach out within 2 business hours.",
                "Thank you for contacting Magnex Solutions.",
              );
            })
            .catch((error) => {
              showSuccess(
                "Message could not be sent.",
                error.message ||
                  "Please try again in a moment or contact Magnex Solutions directly.",
                "The contact form needs to be uploaded to a PHP-enabled hosting server to send email.",
                true,
              );
            })
            .finally(() => {
              submitBtn.textContent = originalText;
              submitBtn.disabled = false;
            });
        } else {
          showSuccess(
            "Server required.",
            "This form cannot send email when opened directly from your computer.",
            "Upload the site to PHP-enabled hosting and submit it through the website URL.",
            true,
          );
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }
      }
    });

    function parseJsonResponse(response) {
      return response.text().then((text) => {
        if (!text.trim()) {
          throw new Error(
            "The server returned an empty response. Please check that PHP mail is enabled on your hosting server.",
          );
        }

        try {
          return {
            ok: response.ok,
            data: JSON.parse(text),
          };
        } catch (error) {
          throw new Error(
            "The server did not return a valid contact form response. Please make sure contact-submit.php is running as PHP.",
          );
        }
      });
    }

    function showSuccess(title, message, note, isError) {
      const success = document.getElementById("formSuccess");
      if (!success) return;

      const titleEl = document.getElementById("formSuccessTitle");
      const messageEl = document.getElementById("formSuccessMessage");
      const noteEl = document.getElementById("formSuccessNote");

      if (titleEl) titleEl.textContent = title;
      if (messageEl) messageEl.textContent = message;
      if (noteEl) noteEl.textContent = note;
      success.classList.toggle("error", Boolean(isError));
      success.classList.add("visible");
    }

    function getFieldValue(id) {
      const field = contactForm.querySelector(`#${id}`);
      return field ? field.value.trim() : "";
    }

    function showError(field, message) {
      const group = field.closest(".form-group");
      group.classList.add("error");
      const err = group.querySelector(".form-error");
      if (err) {
        err.textContent = message;
        err.classList.add("visible");
      }
    }
  }

  const floatEls = document.querySelectorAll(".float-anim");
  floatEls.forEach((el, i) => {
    el.style.animationDelay = `${i * 0.6}s`;
    el.style.animation = `float ${3 + i * 0.5}s ease-in-out infinite`;
  });

  function animateCounter(el) {
    const target = parseInt(el.dataset.target);
    const duration = 1800;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent =
        Math.floor(current).toLocaleString() + (el.dataset.suffix || "");
    }, 16);
  }

  const counters = document.querySelectorAll("[data-counter]");
  if (counters.length && "IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 },
    );
    counters.forEach((c) => counterObserver.observe(c));
  }
})();
