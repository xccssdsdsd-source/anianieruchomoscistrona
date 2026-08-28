// Rok w stopce
document.getElementById("rok").textContent = new Date().getFullYear();

// Pasek nawigacji zmienia się po zejściu z hero
const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("is-stuck", window.scrollY > 60);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

// Podświetlenie aktualnej sekcji w nawigacji
const navLinks = [...document.querySelectorAll(".nav__links a")];
const sections = navLinks
  .map((a) => document.querySelector(a.getAttribute("href")))
  .filter(Boolean);

if (sections.length && "IntersectionObserver" in window) {
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) =>
          a.toggleAttribute("aria-current", a.getAttribute("href") === "#" + entry.target.id)
        );
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((el) => spy.observe(el));
}
