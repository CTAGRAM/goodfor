Run the sql yourself using supabase mcp tool and the flow for scan should be in the format below with real data and no demo data used and every scan result and their alt , etc should be saved in the database of supabase :

after person scans product :

1 : Scanning proccess. :

import { Icon } from "@iconify/react";

export function ScanProcessing() {
  return (
    <div className="flex flex-col h-screen bg-background relative overflow-hidden font-sans text-foreground">
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-chart-1/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-accent/30 rounded-full blur-3xl translate-x-1/4 translate-y-1/4 pointer-events-none" />
      <header className="relative z-20 px-6 pt-14 pb-4 flex justify-between items-center opacity-40">
        <button className="w-11 h-11 flex items-center justify-center rounded-full bg-card/80 backdrop-blur-md shadow-sm text-foreground">
          <Icon icon="solar:arrow-left-linear" className="size-6" />
        </button>
      </header>
      <div className="flex-1 relative z-10 flex flex-col items-center justify-center px-8">
        <div className="relative mb-12">
          <div className="absolute inset-0 size-32 -m-4 rounded-full border-2 border-primary/10 animate-pulse" />
          <div className="absolute inset-0 size-24 rounded-full border-t-2 border-r-2 border-primary/40 animate-spin [animation-duration:3s]" />
          <div className="size-24 rounded-full bg-card shadow-sm border border-border/50 flex items-center justify-center relative z-10">
            <Icon icon="solar:leaf-bold" className="size-10 text-chart-1 animate-pulse" />
          </div>
          <div className="absolute -top-2 -right-2 size-3 bg-accent rounded-full animate-bounce [animation-delay:0.2s]" />
          <div className="absolute -bottom-1 -left-1 size-2 bg-chart-1/40 rounded-full animate-bounce [animation-delay:0.5s]" />
        </div>
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold font-heading text-primary">Checking ingredients...</h2>
          <p className="text-muted-foreground font-medium text-balance max-w-xs">
            This usually takes a few seconds
          </p>
        </div>
        <div className="mt-16 flex items-center gap-3 px-5 py-2 rounded-full bg-accent/20 border border-accent/30">
          <div className="size-1.5 rounded-full bg-chart-1 animate-pulse" />
          <span className="text-xs font-semibold text-primary/70 tracking-wider uppercase">
            Analysing Product
          </span>
          <div className="size-1.5 rounded-full bg-chart-1 animate-pulse [animation-delay:0.3s]" />
        </div>
      </div>
      <footer className="relative z-20 pb-28 pt-10 px-6 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-muted-foreground/60 mb-5">
          <Icon icon="solar:shield-check-bold" className="size-4" />
          <span className="text-[10px] uppercase tracking-widest font-bold">
            Verifying against global standards
          </span>
        </div>
      </footer>
      <nav className="fixed bottom-0 left-0 right-0 pb-6 pt-2 z-50 px-4">
        <div className="flex justify-around items-center px-4 py-3 bg-card rounded-full shadow-lg border border-border/50 relative">
          <button className="flex flex-col items-center gap-1 p-2 w-14 text-muted-foreground opacity-50">
            <Icon icon="solar:home-2-linear" className="size-6" />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 w-14 text-muted-foreground opacity-50">
            <Icon icon="solar:history-linear" className="size-6" />
            <span className="text-[10px] font-medium">History</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 w-14 text-primary">
            <div className="w-12 h-12 rounded-full bg-primary shadow-lg flex items-center justify-center mb-1">
              <Icon icon="solar:qr-code-bold" className="size-6 text-primary-foreground" />
            </div>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 w-14 text-muted-foreground opacity-50">
            <Icon icon="solar:chat-round-dots-bold" className="size-6" />
            <span className="text-[10px] font-medium">AI</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 w-14 text-muted-foreground opacity-50">
            <Icon icon="solar:settings-linear" className="size-6" />
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
}


---

2 : after scanning shpw result :

import { Icon } from "@iconify/react";

export function ProductSummary() {
  return (
    <div className="flex flex-col h-screen bg-background relative overflow-hidden font-sans text-foreground">
      <div className="absolute top-1/4 left-0 w-64 h-64 bg-chart-1/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-48 h-48 bg-accent/30 rounded-full blur-3xl translate-x-1/4 translate-y-1/4 pointer-events-none" />
      <header className="relative z-20 px-6 pt-14 pb-4 flex justify-between items-center">
        <button className="w-11 h-11 flex items-center justify-center rounded-full bg-card/80 backdrop-blur-md shadow-sm text-foreground">
          <Icon icon="solar:arrow-left-linear" className="size-6" />
        </button>
        <h1 className="text-lg font-bold font-heading text-primary">Analysis Result</h1>
        <button className="w-11 h-11 flex items-center justify-center rounded-full bg-card/80 backdrop-blur-md shadow-sm text-foreground">
          <Icon icon="solar:share-linear" className="size-5" />
        </button>
      </header>
      <main className="flex-1 relative z-10 px-6 py-4 overflow-y-auto pb-32">
        <div className="bg-card rounded-3xl shadow-sm border border-border/40 overflow-hidden mb-4">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Cereal & Grains
                </span>
                <h2 className="text-2xl font-bold font-heading text-primary leading-tight">
                  Organic Honey O's
                </h2>
              </div>
              <div className="size-16 rounded-2xl bg-muted flex items-center justify-center overflow-hidden">
                <img
                  alt="Product"
                  src="https://www.costco.co.uk/medias/sys_master/images/h47/hcf/134013104062494.webp"
                  className="size-full object-cover"
                />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center py-6 px-4 bg-chart-1/5 rounded-2xl border border-chart-1/10">
              <div className="size-16 rounded-full bg-chart-1/20 flex items-center justify-center mb-3">
                <Icon icon="solar:check-circle-bold" className="size-10 text-chart-1" />
              </div>
              <span className="text-2xl font-bold text-chart-1 font-heading">Safe</span>
              <p className="text-sm text-chart-1/80 font-medium text-center mt-1">
                Matches all family health preferences
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-border/30">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
                <Icon icon="solar:leaf-bold" className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  Environmental info available
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex -space-x-2">
            <img
              alt="User"
              src="https://randomuser.me/api/portraits/women/32.jpg"
              className="size-6 rounded-full border-2 border-background"
            />
            <img
              alt="User"
              src="https://randomuser.me/api/portraits/men/44.jpg"
              className="size-6 rounded-full border-2 border-background"
            />
            <img
              alt="User"
              src="https://randomuser.me/api/portraits/women/68.jpg"
              className="size-6 rounded-full border-2 border-background"
            />
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            Based on <span className="text-primary font-bold">The Miller Family</span> profile
          </p>
        </div>
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-primary uppercase tracking-widest px-1">
            Ingredient Breakdown
          </h3>
          <div className="bg-card p-4 rounded-2xl border border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-chart-1/10 flex items-center justify-center">
                <Icon icon="solar:leaf-bold" className="size-5 text-chart-1" />
              </div>
              <div>
                <p className="text-sm font-bold">Natural Ingredients</p>
                <p className="text-xs text-muted-foreground">94% Organic sources</p>
              </div>
            </div>
            <Icon icon="solar:alt-arrow-right-linear" className="size-5 text-muted-foreground/40" />
          </div>
          <div className="bg-card p-4 rounded-2xl border border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-chart-2/10 flex items-center justify-center">
                <Icon icon="solar:water-bold" className="size-5 text-chart-2" />
              </div>
              <div>
                <p className="text-sm font-bold">Added Sugars</p>
                <p className="text-xs text-muted-foreground">Low (4g per serving)</p>
              </div>
            </div>
            <Icon icon="solar:alt-arrow-right-linear" className="size-5 text-muted-foreground/40" />
          </div>
          <div className="bg-card p-4 rounded-2xl border border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-accent flex items-center justify-center">
                <Icon icon="solar:shield-check-bold" className="size-5 text-primary/70" />
              </div>
              <div>
                <p className="text-sm font-bold">Allergen Friendly</p>
                <p className="text-xs text-muted-foreground">No nuts or soy detected</p>
              </div>
            </div>
            <Icon icon="solar:alt-arrow-right-linear" className="size-5 text-muted-foreground/40" />
          </div>
        </div>
        <button className="w-full mt-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
          <Icon icon="solar:heart-bold" className="size-5" />
          Save to Favorites
        </button>
      </main>
      <nav className="fixed bottom-0 left-0 right-0 pb-6 pt-2 z-50 px-4">
        <div className="flex justify-around items-center px-4 py-3 bg-card rounded-full shadow-lg border border-border/50 relative">
          <button className="flex flex-col items-center gap-1 p-2 w-14 text-muted-foreground opacity-50">
            <Icon icon="solar:home-2-linear" className="size-6" />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 w-14 text-muted-foreground opacity-50">
            <Icon icon="solar:history-linear" className="size-6" />
            <span className="text-[10px] font-medium">History</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 w-14 text-primary">
            <div className="w-12 h-12 rounded-full bg-primary shadow-lg flex items-center justify-center mb-1">
              <Icon icon="solar:qr-code-bold" className="size-6 text-primary-foreground" />
            </div>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 w-14 text-muted-foreground hover:text-primary transition-colors">
            <Icon icon="solar:chat-round-dots-bold" className="size-6" />
            <span className="text-[10px] font-medium">AI</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 w-14 text-muted-foreground opacity-50">
            <Icon icon="solar:settings-linear" className="size-6" />
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
}


---

3 : when user clicks on the score liek safe , not safe , etc then they should go to a page with detailed score analysis :

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SafetyScoreDetails</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100;200;300;400;500;600;700;800&display=swap"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&display=swap"
      rel="stylesheet"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700;800;900&display=swap"
      rel="stylesheet"
    />
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <script src="https://code.iconify.design/iconify-icon/3.0.0/iconify-icon.min.js"></script>
    <style type="text/tailwindcss">

      @theme inline {
        --color-background: var(--background);
        --color-foreground: var(--foreground);
        --color-primary: var(--primary);
        --color-primary-foreground: var(--primary-foreground);
        --color-secondary: var(--secondary);
        --color-secondary-foreground: var(--secondary-foreground);
        --color-muted: var(--muted);
        --color-muted-foreground: var(--muted-foreground);
        --color-accent: var(--accent);
        --color-accent-foreground: var(--accent-foreground);
        --color-destructive: var(--destructive);
        --color-card: var(--card);
        --color-card-foreground: var(--card-foreground);
        --color-popover: var(--popover);
        --color-popover-foreground: var(--popover-foreground);
        --color-border: var(--border);
        --color-input: var(--input);
        --color-ring: var(--ring);
        --color-chart-1: var(--chart-1);
        --color-chart-2: var(--chart-2);
        --color-chart-3: var(--chart-3);
        --color-chart-4: var(--chart-4);
        --color-chart-5: var(--chart-5);

        --font-font-sans: var(--font-sans);
        --font-font-heading: var(--font-heading);
        --font-font-serif: var(--font-serif);
        --font-font-mono: var(--font-mono);

        --radius-sm: calc(var(--radius) - 4px);
        --radius-md: calc(var(--radius) - 2px);
        --radius-lg: var(--radius);
        --radius-xl: calc(var(--radius) + 4px);

        --tracking-tighter: calc(var(--tracking-normal) - 0.05em);
        --tracking-tight: calc(var(--tracking-normal) - 0.025em);
        --tracking-wide: calc(var(--tracking-normal) + 0.025em);
        --tracking-wider: calc(var(--tracking-normal) + 0.05em);
        --tracking-widest: calc(var(--tracking-normal) + 0.1em);
        --tracking-normal: var(--tracking-normal);
      }

      :root {
          --background: #F2F5F3;
        --foreground: #1A1D1C;
        --primary: #243628;
        --primary-foreground: #FFFFFF;
        --secondary: #E4E9E6;
        --secondary-foreground: #243628;
        --muted: #F0F2F1;
        --muted-foreground: #6C7570;
        --accent: #D6E4DA;
        --accent-foreground: #1A1D1C;
        --destructive: #D93025;
        --card: #FFFFFF;
        --card-foreground: #1A1D1C;
        --popover: #FFFFFF;
        --popover-foreground: #1A1D1C;
        --border: #E1E6E3;
        --input: #EFF2F0;
        --ring: #243628;
        --chart-1: #34A853;
        --chart-2: #FBBC04;
        --chart-3: #EA4335;
        --chart-4: #5F6368;
        --chart-5: #8AB4F8;

        --font-sans: "Rubik";
        --font-heading: "Rubik";
        --font-serif: "Playfair Display";
        --font-mono: "JetBrains Mono";

        --radius: 1rem;
      }
    </style>
  </head>
  <body>
    <div
      class="flex flex-col h-screen bg-background relative overflow-hidden font-sans text-foreground"
    >
      <div
        class="absolute top-1/4 left-0 w-64 h-64 bg-chart-1/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      ></div>
      <div
        class="absolute bottom-1/4 right-0 w-48 h-48 bg-accent/30 rounded-full blur-3xl translate-x-1/4 translate-y-1/4 pointer-events-none"
      ></div>
      <header class="relative z-20 px-6 pt-14 pb-4 flex justify-between items-center">
        <button
          class="w-11 h-11 flex items-center justify-center rounded-full bg-card/80 backdrop-blur-md shadow-sm text-foreground"
        >
          <iconify-icon icon="solar:arrow-left-linear" class="size-6"></iconify-icon>
        </button>
        <h1 class="text-lg font-bold font-heading text-primary">Safety by age</h1>
        <button
          class="w-11 h-11 flex items-center justify-center rounded-full bg-card/80 backdrop-blur-md shadow-sm text-foreground"
        >
          <iconify-icon icon="solar:info-circle-linear" class="size-5"></iconify-icon>
        </button>
      </header>
      <main class="flex-1 relative z-10 px-6 py-4 overflow-y-auto pb-32">
        <div class="bg-card rounded-3xl shadow-sm border border-border/40 overflow-hidden mb-8">
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <div class="size-8 rounded-lg bg-accent flex items-center justify-center">
                  <iconify-icon
                    icon="solar:shield-check-bold"
                    class="size-5 text-primary"
                  ></iconify-icon>
                </div>
                <span class="text-sm font-bold text-primary">Overall Score</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-2xl font-bold text-chart-1">8.5</span
                ><span class="text-xs text-muted-foreground">/10</span>
              </div>
            </div>
            <div class="h-2 w-full bg-muted rounded-full overflow-hidden mb-3">
              <div class="h-full bg-chart-1 w-[85%] rounded-full"></div>
            </div>
            <p class="text-xs text-muted-foreground leading-relaxed mb-5">
              Based on 14 clinical studies and 3 independent regulatory reviews. This product is
              well-documented for these age groups.
            </p>
            <div class="space-y-3 mb-4">
              <div
                class="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/30"
              >
                <div class="flex items-center gap-3 flex-1">
                  <div
                    class="size-8 rounded-lg bg-chart-1/10 flex items-center justify-center flex-shrink-0"
                  >
                    <iconify-icon icon="solar:leaf-bold" class="size-4 text-chart-1"></iconify-icon>
                  </div>
                  <div class="flex-1">
                    <p class="text-xs font-bold text-foreground mb-0.5">Ingredients Safety</p>
                    <p class="text-[10px] text-muted-foreground">All ingredients age-appropriate</p>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <span class="text-sm font-bold text-chart-1">2.5</span
                  ><span class="text-[10px] text-muted-foreground">/2.5</span>
                </div>
              </div>
              <div
                class="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/30"
              >
                <div class="flex items-center gap-3 flex-1">
                  <div
                    class="size-8 rounded-lg bg-chart-1/10 flex items-center justify-center flex-shrink-0"
                  >
                    <iconify-icon
                      icon="solar:danger-triangle-bold"
                      class="size-4 text-chart-1"
                    ></iconify-icon>
                  </div>
                  <div class="flex-1">
                    <p class="text-xs font-bold text-foreground mb-0.5">Allergen Profile</p>
                    <p class="text-[10px] text-muted-foreground">No major allergens detected</p>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <span class="text-sm font-bold text-chart-1">2.0</span
                  ><span class="text-[10px] text-muted-foreground">/2.0</span>
                </div>
              </div>
              <div
                class="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/30"
              >
                <div class="flex items-center gap-3 flex-1">
                  <div
                    class="size-8 rounded-lg bg-chart-2/10 flex items-center justify-center flex-shrink-0"
                  >
                    <iconify-icon
                      icon="solar:test-tube-bold"
                      class="size-4 text-chart-2"
                    ></iconify-icon>
                  </div>
                  <div class="flex-1">
                    <p class="text-xs font-bold text-foreground mb-0.5">Nutritional Value</p>
                    <p class="text-[10px] text-muted-foreground">High fiber, moderate sugar</p>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <span class="text-sm font-bold text-chart-2">1.5</span
                  ><span class="text-[10px] text-muted-foreground">/2.0</span>
                </div>
              </div>
              <div
                class="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/30"
              >
                <div class="flex items-center gap-3 flex-1">
                  <div
                    class="size-8 rounded-lg bg-chart-1/10 flex items-center justify-center flex-shrink-0"
                  >
                    <iconify-icon
                      icon="solar:document-text-bold"
                      class="size-4 text-chart-1"
                    ></iconify-icon>
                  </div>
                  <div class="flex-1">
                    <p class="text-xs font-bold text-foreground mb-0.5">Clinical Evidence</p>
                    <p class="text-[10px] text-muted-foreground">Well-documented studies</p>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <span class="text-sm font-bold text-chart-1">2.0</span
                  ><span class="text-[10px] text-muted-foreground">/2.0</span>
                </div>
              </div>
              <div
                class="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/30"
              >
                <div class="flex items-center gap-3 flex-1">
                  <div
                    class="size-8 rounded-lg bg-chart-3/10 flex items-center justify-center flex-shrink-0"
                  >
                    <iconify-icon
                      icon="solar:shield-warning-bold"
                      class="size-4 text-chart-3"
                    ></iconify-icon>
                  </div>
                  <div class="flex-1">
                    <p class="text-xs font-bold text-foreground mb-0.5">Age Suitability</p>
                    <p class="text-[10px] text-muted-foreground">Choking risk for toddlers</p>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <span class="text-sm font-bold text-chart-3">0.5</span
                  ><span class="text-[10px] text-muted-foreground">/1.5</span>
                </div>
              </div>
            </div>
            <div class="p-3 bg-muted/50 rounded-xl border border-border/30 space-y-2">
              <div class="flex items-start gap-2">
                <iconify-icon
                  icon="solar:check-circle-bold"
                  class="size-4 text-chart-1 mt-0.5 flex-shrink-0"
                ></iconify-icon>
                <p class="text-xs text-foreground">No pork ingredients detected</p>
              </div>
              <div class="flex items-start gap-2">
                <iconify-icon
                  icon="solar:close-circle-bold"
                  class="size-4 text-chart-3 mt-0.5 flex-shrink-0"
                ></iconify-icon>
                <p class="text-xs text-foreground">
                  Contains beef (not suitable for Halal profile)
                </p>
              </div>
              <div class="flex items-start gap-2">
                <iconify-icon
                  icon="solar:info-circle-bold"
                  class="size-4 text-chart-2 mt-0.5 flex-shrink-0"
                ></iconify-icon>
                <p class="text-xs text-foreground">May contain traces of dairy</p>
              </div>
            </div>
            <button
              class="w-full mt-4 pt-4 border-t border-border/30 flex items-center justify-between group active:opacity-70 transition-opacity"
            >
              <div class="flex items-center gap-2">
                <iconify-icon
                  icon="solar:checklist-bold"
                  class="size-4 text-primary/60"
                ></iconify-icon
                ><span class="text-xs text-muted-foreground"
                  >This score considers your selected dietary preferences.</span
                >
              </div>
              <iconify-icon
                icon="solar:alt-arrow-down-linear"
                class="size-4 text-muted-foreground group-active:rotate-180 transition-transform"
              ></iconify-icon>
            </button>
          </div>
        </div>
        <div class="space-y-4">
          <div class="flex items-center justify-between px-1">
            <h3 class="text-sm font-bold text-primary uppercase tracking-widest">
              Profile Analysis
            </h3>
            <span
              class="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full"
              >3 MEMBERS</span
            >
          </div>
          <div
            class="bg-card p-5 rounded-3xl border border-border/30 flex items-center justify-between"
          >
            <div class="flex items-center gap-4">
              <div class="relative">
                <img
                  alt="David"
                  src="https://randomuser.me/api/portraits/men/44.jpg"
                  class="size-14 rounded-2xl object-cover"
                />
                <div
                  class="absolute -bottom-1 -right-1 size-5 rounded-full bg-chart-1 flex items-center justify-center border-2 border-card"
                >
                  <iconify-icon
                    icon="solar:check-circle-bold"
                    class="size-3 text-white"
                  ></iconify-icon>
                </div>
              </div>
              <div>
                <p class="text-base font-bold">David Miller</p>
                <p class="text-xs text-muted-foreground">Adult (38y)</p>
              </div>
            </div>
            <div class="flex flex-col items-end gap-1">
              <div class="px-3 py-1 rounded-full bg-chart-1/10 border border-chart-1/20">
                <span class="text-[10px] font-bold text-chart-1 uppercase tracking-wider"
                  >Perfectly Safe</span
                >
              </div>
              <span class="text-[10px] text-muted-foreground">No triggers found</span>
            </div>
          </div>
          <div
            class="bg-card p-5 rounded-3xl border border-border/30 flex items-center justify-between"
          >
            <div class="flex items-center gap-4">
              <div class="relative">
                <img
                  alt="Emma"
                  src="https://randomuser.me/api/portraits/women/32.jpg"
                  class="size-14 rounded-2xl object-cover"
                />
                <div
                  class="absolute -bottom-1 -right-1 size-5 rounded-full bg-chart-2 flex items-center justify-center border-2 border-card"
                >
                  <iconify-icon
                    icon="solar:info-circle-bold"
                    class="size-3 text-white"
                  ></iconify-icon>
                </div>
              </div>
              <div>
                <p class="text-base font-bold">Emma Miller</p>
                <p class="text-xs text-muted-foreground">Child (8y)</p>
              </div>
            </div>
            <div class="flex flex-col items-end gap-1">
              <div class="px-3 py-1 rounded-full bg-chart-2/10 border border-chart-2/20">
                <span class="text-[10px] font-bold text-chart-2 uppercase tracking-wider"
                  >Use Precaution</span
                >
              </div>
              <span class="text-[10px] text-muted-foreground">Limit serving size</span>
            </div>
          </div>
          <div
            class="bg-card p-5 rounded-3xl border border-border/30 flex items-center justify-between"
          >
            <div class="flex items-center gap-4">
              <div class="relative">
                <img
                  alt="Baby Sarah"
                  src="https://randomuser.me/api/portraits/women/68.jpg"
                  class="size-14 rounded-2xl object-cover"
                />
                <div
                  class="absolute -bottom-1 -right-1 size-5 rounded-full bg-chart-3 flex items-center justify-center border-2 border-card"
                >
                  <iconify-icon icon="solar:danger-bold" class="size-3 text-white"></iconify-icon>
                </div>
              </div>
              <div>
                <p class="text-base font-bold">Sarah Miller</p>
                <p class="text-xs text-muted-foreground">Toddler (2y)</p>
              </div>
            </div>
            <div class="flex flex-col items-end gap-1">
              <div class="px-3 py-1 rounded-full bg-chart-3/10 border border-chart-3/20">
                <span class="text-[10px] font-bold text-chart-3 uppercase tracking-wider"
                  >Not Recommended</span
                >
              </div>
              <span class="text-[10px] text-muted-foreground">Choking hazard potential</span>
            </div>
          </div>
        </div>
        <div class="mt-8 px-2">
          <div class="flex items-start gap-3 p-4 bg-muted rounded-2xl border border-border/50">
            <iconify-icon
              icon="solar:notes-bold"
              class="size-5 text-primary/60 mt-0.5"
            ></iconify-icon>
            <div>
              <p class="text-xs font-bold text-primary mb-1">Safety Summary</p>
              <p class="text-xs text-muted-foreground leading-relaxed">
                While safe for adults, the high fiber content and texture might be challenging for
                children under 5. Always supervise during consumption.
              </p>
            </div>
          </div>
        </div>
      </main>
      <nav class="fixed bottom-0 left-0 right-0 pb-6 pt-2 z-50 px-4">
        <div
          class="flex justify-around items-center px-4 py-3 bg-card rounded-full shadow-lg border border-border/50 relative"
        >
          <button
            class="flex flex-col items-center gap-1 p-2 w-14 text-muted-foreground opacity-50"
          >
            <iconify-icon icon="solar:home-2-linear" class="size-6"></iconify-icon
            ><span class="text-[10px] font-medium">Home</span></button
          ><button
            class="flex flex-col items-center gap-1 p-2 w-14 text-muted-foreground opacity-50"
          >
            <iconify-icon icon="solar:history-linear" class="size-6"></iconify-icon
            ><span class="text-[10px] font-medium">History</span></button
          ><button class="flex flex-col items-center gap-1 p-2 w-14 text-primary">
            <div
              class="w-12 h-12 rounded-full bg-primary shadow-lg flex items-center justify-center mb-1"
            >
              <iconify-icon
                icon="solar:qr-code-bold"
                class="size-6 text-primary-foreground"
              ></iconify-icon>
            </div></button
          ><button
            class="flex flex-col items-center gap-1 p-2 w-14 text-muted-foreground opacity-50"
          >
            <iconify-icon icon="solar:chat-round-dots-bold" class="size-6"></iconify-icon
            ><span class="text-[10px] font-medium">AI</span></button
          ><button
            class="flex flex-col items-center gap-1 p-2 w-14 text-muted-foreground opacity-50"
          >
            <iconify-icon icon="solar:settings-linear" class="size-6"></iconify-icon
            ><span class="text-[10px] font-medium">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  </body>
</html>


---
then when they click on the button from image which comes in detailed score we they can see ingredient glossary :

import { Icon } from "@iconify/react";

export function IngredientExplanations() {
  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden font-sans text-foreground">
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute top-1/4 left-0 w-48 h-48 bg-chart-1/5 rounded-full blur-3xl -translate-x-1/2 pointer-events-none" />
      <header className="px-6 pt-14 pb-4 flex items-center z-10">
        <button className="size-11 flex items-center justify-center -ml-3 rounded-full hover:bg-muted/50 transition-colors">
          <Icon icon="solar:arrow-left-linear" className="size-6 text-foreground" />
        </button>
        <div className="flex-1" />
        <button className="size-11 flex items-center justify-center rounded-full hover:bg-muted/50">
          <Icon icon="solar:magnifer-linear" className="size-6 text-foreground" />
        </button>
      </header>
      <main className="flex-1 overflow-y-auto px-6 pb-12 z-10">
        <div className="mt-4 mb-8">
          <h1 className="text-[28px] font-extrabold font-heading text-foreground leading-tight mb-3">
            Ingredient Glossary
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Simple, honest explanations for every ingredient in this product. No jargon, just the
            facts.
          </p>
        </div>
        <div className="space-y-4">
          <div className="bg-card rounded-[24px] p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold font-heading text-foreground">Purified Water</h2>
                <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-chart-1/10 text-chart-1">
                  Generally safe
                </div>
              </div>
              <Icon icon="solar:check-circle-bold" className="size-6 text-chart-1" />
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              Cleaned and filtered water used as the base for this drink to ensure purity and
              safety.
            </p>
            <div className="pt-4 border-t border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Why this ingredient matters
                </span>
                <Icon icon="solar:alt-arrow-down-linear" className="size-5 text-muted-foreground" />
              </div>
              <div className="mt-2 text-sm text-foreground/80 leading-relaxed">
                Water is essential for hydration and provides the liquid texture needed to mix all
                other ingredients evenly.
              </div>
            </div>
          </div>
          <div className="bg-card rounded-[24px] p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold font-heading text-foreground">Cane Sugar</h2>
                <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-chart-2/10 text-chart-2">
                  Needs caution
                </div>
              </div>
              <Icon icon="solar:danger-triangle-bold" className="size-6 text-chart-2" />
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              A natural sweetener made from sugar cane plants to improve the overall taste.
            </p>
            <div className="pt-4 border-t border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Why this ingredient matters
                </span>
                <Icon
                  icon="solar:alt-arrow-right-linear"
                  className="size-5 text-muted-foreground"
                />
              </div>
            </div>
          </div>
          <div className="bg-card rounded-[24px] p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold font-heading text-foreground">Citric Acid</h2>
                <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-chart-1/10 text-chart-1">
                  Generally safe
                </div>
              </div>
              <Icon icon="solar:check-circle-bold" className="size-6 text-chart-1" />
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              A natural substance found in citrus fruits like lemons and limes, used to keep food
              fresh.
            </p>
            <div className="pt-4 border-t border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Why this ingredient matters
                </span>
                <Icon
                  icon="solar:alt-arrow-right-linear"
                  className="size-5 text-muted-foreground"
                />
              </div>
            </div>
          </div>
          <div className="bg-card rounded-[24px] p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold font-heading text-foreground">Pectin</h2>
                <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-bold bg-chart-1/10 text-chart-1">
                  Generally safe
                </div>
              </div>
              <Icon icon="solar:check-circle-bold" className="size-6 text-chart-1" />
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              A type of fiber found in many fruits that helps give foods a smooth, thick
              consistency.
            </p>
            <div className="pt-4 border-t border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Why this ingredient matters
                </span>
                <Icon
                  icon="solar:alt-arrow-right-linear"
                  className="size-5 text-muted-foreground"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 mb-6 p-6 rounded-[24px] bg-accent/20 border border-accent">
          <div className="flex items-center gap-3 mb-2">
            <Icon icon="solar:info-circle-bold" className="size-5 text-primary" />
            <span className="font-bold text-sm text-primary">Our Standard</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Our labels are based on the latest health guidelines and independent research. We focus
            on transparency so you can shop with confidence.
          </p>
        </div>
        <div className="mt-4 bg-card rounded-[24px] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon icon="solar:leaf-bold" className="size-5 text-chart-1" />
              <span className="text-sm font-bold text-foreground">Environmental notes</span>
            </div>
            <Icon icon="solar:alt-arrow-right-linear" className="size-5 text-muted-foreground" />
          </div>
        </div>
      </main>
      <div className="px-6 py-4 bg-background border-t border-border flex justify-center items-center">
        <button className="w-full bg-primary text-primary-foreground h-14 rounded-full flex items-center justify-center gap-3 font-bold shadow-md">
          <Icon icon="solar:share-bold" className="size-5" />
          <span>Share Analysis</span>
        </button>
      </div>
    </div>
  );
}


---

and finally they can select to see the alternative options of the product they scanned :

import { Icon } from "@iconify/react";

export function AlternativesRecommendations() {
  return (
    <div className="flex flex-col h-screen bg-background relative overflow-hidden font-sans text-foreground">
      <div className="absolute top-1/4 left-0 w-64 h-64 bg-chart-1/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-48 h-48 bg-accent/30 rounded-full blur-3xl translate-x-1/4 translate-y-1/4 pointer-events-none" />
      <header className="relative z-20 px-6 pt-14 pb-4 flex justify-between items-center">
        <button className="w-11 h-11 flex items-center justify-center rounded-full bg-card/80 backdrop-blur-md shadow-sm text-foreground">
          <Icon icon="solar:arrow-left-linear" className="size-6" />
        </button>
        <h1 className="text-lg font-bold font-heading text-primary">Safer Alternatives</h1>
        <button className="w-11 h-11 flex items-center justify-center rounded-full bg-card/80 backdrop-blur-md shadow-sm text-foreground">
          <Icon icon="solar:magnifer-linear" className="size-5" />
        </button>
      </header>
      <main className="flex-1 relative z-10 px-6 py-4 overflow-y-auto pb-32">
        <div className="mb-8">
          <h2 className="text-2xl font-bold font-heading text-primary leading-tight">
            Better for you & your home
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            We found these top-rated options that match your family's health profile perfectly.
          </p>
        </div>
        <div className="space-y-6">
          <div className="bg-card rounded-3xl shadow-sm border border-border/40 overflow-hidden">
            <div className="p-5">
              <div className="flex gap-4 mb-4">
                <div className="size-20 rounded-2xl bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    alt="Alternative Product"
                    src="https://www.bbassets.com/media/uploads/p/l/40082902_13-by-nature-oats-rolled.jpg"
                    className="size-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-chart-1 px-2 py-0.5 bg-chart-1/10 rounded-full uppercase tracking-wider">
                      Top Match
                    </span>
                    <div className="flex items-center gap-1 bg-chart-1/5 px-2 py-0.5 rounded-lg">
                      <Icon icon="solar:star-bold" className="size-3 text-chart-1" />
                      <span className="text-xs font-bold text-chart-1">98/100</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold font-heading text-primary mt-1">
                    Pure Nature Oats
                  </h3>
                  <p className="text-xs text-muted-foreground">Certified Organic • Gluten Free</p>
                </div>
              </div>
              <div className="bg-muted/50 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-1">
                  Why it's better
                </p>
                <div className="flex items-start gap-3">
                  <div className="size-5 rounded-full bg-chart-1/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon icon="solar:check-circle-bold" className="size-3.5 text-chart-1" />
                  </div>
                  <p className="text-sm font-medium">Zero synthetic pesticides or additives</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="size-5 rounded-full bg-chart-1/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon icon="solar:check-circle-bold" className="size-3.5 text-chart-1" />
                  </div>
                  <p className="text-sm font-medium">Naturally sweetened with real fruit</p>
                </div>
              </div>
              <button className="w-full mt-4 py-3 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2">
                View details
                <Icon icon="solar:alt-arrow-right-linear" className="size-4" />
              </button>
            </div>
          </div>
          <div className="bg-card rounded-3xl shadow-sm border border-border/40 overflow-hidden">
            <div className="p-5">
              <div className="flex gap-4 mb-4">
                <div className="size-20 rounded-2xl bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    alt="Alternative Product"
                    src="https://www.earthsbest.com/uploads/generic/products/_1220x1626_fit_center-center_92_none/10705/earths-best-organic-multigrain-baby-cereal-fop.webp"
                    className="size-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-muted-foreground px-2 py-0.5 bg-muted rounded-full uppercase tracking-wider">
                      Eco-Friendly
                    </span>
                    <div className="flex items-center gap-1 bg-chart-1/5 px-2 py-0.5 rounded-lg">
                      <Icon icon="solar:star-bold" className="size-3 text-chart-1" />
                      <span className="text-xs font-bold text-chart-1">94/100</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold font-heading text-primary mt-1">
                    Earth's Best Blend
                  </h3>
                  <p className="text-xs text-muted-foreground">Whole Grain • Non-GMO</p>
                </div>
              </div>
              <div className="bg-muted/50 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-1">
                  Why it's better
                </p>
                <div className="flex items-start gap-3">
                  <div className="size-5 rounded-full bg-chart-1/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon icon="solar:check-circle-bold" className="size-3.5 text-chart-1" />
                  </div>
                  <p className="text-sm font-medium">3x higher fiber content for digestion</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="size-5 rounded-full bg-chart-1/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon icon="solar:check-circle-bold" className="size-3.5 text-chart-1" />
                  </div>
                  <p className="text-sm font-medium">Sustainable farming certifications</p>
                </div>
              </div>
              <button className="w-full mt-4 py-3 border border-primary text-primary rounded-xl font-bold flex items-center justify-center gap-2">
                View details
                <Icon icon="solar:alt-arrow-right-linear" className="size-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center text-center px-4">
          <div className="size-12 rounded-full bg-accent flex items-center justify-center mb-3">
            <Icon icon="solar:medal-star-bold" className="size-6 text-primary/70" />
          </div>
          <p className="text-sm font-medium text-primary">
            Great choices lead to a healthier lifestyle!
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            All alternatives are vetted by our expert panel of nutritionists.
          </p>
        </div>
      </main>
      <nav className="fixed bottom-0 left-0 right-0 pb-6 pt-2 z-50 px-4">
        <div className="flex justify-around items-center px-4 py-3 bg-card rounded-full shadow-lg border border-border/50 relative">
          <button className="flex flex-col items-center gap-1 p-2 w-14 text-muted-foreground opacity-50">
            <Icon icon="solar:home-2-linear" className="size-6" />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 w-14 text-muted-foreground opacity-50">
            <Icon icon="solar:history-linear" className="size-6" />
            <span className="text-[10px] font-medium">History</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 w-14 text-primary">
            <div className="w-12 h-12 rounded-full bg-primary shadow-lg flex items-center justify-center mb-1">
              <Icon icon="solar:qr-code-bold" className="size-6 text-primary-foreground" />
            </div>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 w-14 text-muted-foreground hover:text-primary transition-colors opacity-50">
            <Icon icon="solar:chat-round-dots-bold" className="size-6" />
            <span className="text-[10px] font-medium">AI</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 w-14 text-muted-foreground opacity-50">
            <Icon icon="solar:settings-linear" className="size-6" />
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

