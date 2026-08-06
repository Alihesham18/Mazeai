import type { NavItem } from "@/types/content";

export const navigation: NavItem[] = [
  { labelKey: "navigation.home", href: "/" },
  { labelKey: "navigation.services", href: "/services" },
  { labelKey: "navigation.training", href: "/training" },
  { labelKey: "navigation.research", href: "/research" },
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
