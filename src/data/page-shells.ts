export interface PageShell {
  path: string;
  titleKey: string;
  descriptionKey: string;
  sections: string[];
}

export const pageShells: PageShell[] = [
  { path: "services", titleKey: "pages.services.title", descriptionKey: "pages.services.description", sections: ["Hero", "Service cards", "Process", "FAQ", "CTA"] },
  { path: "research", titleKey: "pages.research.title", descriptionKey: "pages.research.description", sections: ["Research areas", "Projects", "Publications", "Methodology", "Partnership CTA"] },
  { path: "events", titleKey: "pages.events.title", descriptionKey: "pages.events.description", sections: ["Featured event", "Filters", "Upcoming events", "Past events", "Host CTA"] },
  { path: "case-studies", titleKey: "pages.caseStudies.title", descriptionKey: "pages.caseStudies.description", sections: ["Filters", "Sample results", "Related services", "CTA"] },
  { path: "about", titleKey: "pages.about.title", descriptionKey: "pages.about.description", sections: ["Overview", "Mission", "Story", "Responsible AI"] },
  { path: "about/team", titleKey: "pages.team.title", descriptionKey: "pages.team.description", sections: ["Role filters", "Placeholder profiles", "Expertise"] },
  { path: "about/partners", titleKey: "pages.partners.title", descriptionKey: "pages.partners.description", sections: ["Partner categories", "Logo grid", "Models", "CTA"] },
  { path: "contact", titleKey: "pages.contact.title", descriptionKey: "pages.contact.description", sections: ["Contact options", "Partnership inquiry", "Local mock handling"] },
  { path: "privacy", titleKey: "pages.privacy.title", descriptionKey: "pages.privacy.description", sections: ["Placeholder notice", "Data minimization", "Deletion workflow"] },
  { path: "cookies", titleKey: "pages.cookies.title", descriptionKey: "pages.cookies.description", sections: ["Placeholder policy", "Preference model"] },
  { path: "terms", titleKey: "pages.terms.title", descriptionKey: "pages.terms.description", sections: ["Placeholder terms", "Service use"] },
  { path: "personal-data-notice", titleKey: "pages.personalData.title", descriptionKey: "pages.personalData.description", sections: ["KVKK placeholder", "Consent version", "Contact"] }
];

export function getPageShell(path: string): PageShell {
  return (
    pageShells.find((page) => page.path === path) || {
      path,
      titleKey: "pages.placeholder.title",
      descriptionKey: "pages.placeholder.description",
      sections: ["Overview", "Sample content", "Next implementation phase"]
    }
  );
}
