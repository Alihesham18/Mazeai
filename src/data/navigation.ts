import type { NavItem } from "@/types/content";

export const navigation: NavItem[] = [
  { labelKey: "navigation.home", href: "/" },
  {
    labelKey: "navigation.services",
    href: "/services",
    children: [
      { labelKey: "navigation.servicesOverview", href: "/services" },
      { labelKey: "navigation.aiConsulting", href: "/services/ai-consulting" },
      {
        labelKey: "navigation.aiSolutions",
        href: "/services/ai-solutions-automation"
      },
      { labelKey: "navigation.researchDevelopment", href: "/services/research-development" },
      { labelKey: "navigation.educationTraining", href: "/services/education-training" },
      { labelKey: "navigation.academicPartnerships", href: "/services/academic-partnerships" },
      { labelKey: "navigation.customPrograms", href: "/services/custom-programs" }
    ]
  },
  {
    labelKey: "navigation.research",
    href: "/research",
    children: [
      { labelKey: "navigation.researchOverview", href: "/research" },
      { labelKey: "navigation.researchAreas", href: "/research/areas" },
      { labelKey: "navigation.currentProjects", href: "/research/projects" },
      { labelKey: "navigation.completedProjects", href: "/research/projects/completed" },
      { labelKey: "navigation.publications", href: "/research/publications" },
      { labelKey: "navigation.innovationLab", href: "/research/innovation-lab" },
      { labelKey: "navigation.researchPartnerships", href: "/research/partnerships" }
    ]
  },
  { labelKey: "navigation.events", href: "/events" },
  { labelKey: "navigation.caseStudies", href: "/case-studies" },
  { labelKey: "navigation.blog", href: "/blog" },
  {
    labelKey: "navigation.about",
    href: "/about",
    children: [
      { labelKey: "navigation.companyOverview", href: "/about" },
      { labelKey: "navigation.missionVision", href: "/about/mission-vision" },
      { labelKey: "navigation.ourStory", href: "/about/our-story" },
      { labelKey: "navigation.team", href: "/about/team" },
      { labelKey: "navigation.partners", href: "/about/partners" },
      { labelKey: "navigation.responsibleAi", href: "/about/responsible-ai" },
      { labelKey: "navigation.careers", href: "/about/careers" }
    ]
  },
  { labelKey: "navigation.contact", href: "/contact" }
];
