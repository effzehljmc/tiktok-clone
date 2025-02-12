graph TD
    subgraph Root
        App[App Entry Point]
        AppJson[app.json]
        Env[.env]
    end

    subgraph Core
        App --> Components[/components/]
        App --> Hooks[/hooks/]
        App --> Utils[/utils/]
        App --> Types[/types/]
        App --> Constants[/constants/]
        App --> Contexts[/contexts/]
    end

    subgraph Navigation
        App --> AppDir[/app/]
        AppDir --> Tabs[/(tabs)/]
        AppDir --> Components2[/_components/]
    end

    subgraph Backend
        App --> Supabase[/supabase/]
        Supabase --> Migrations[/migrations/]
        App --> Services[/services/]
        App --> Prisma[/prisma/]
    end

    subgraph Internationalization
        App --> I18n[/i18n/]
        I18n --> En[en.ts]
        I18n --> De[de.ts]
    end

    subgraph UI
        Components --> Recipe[/recipe/]
        Recipe --> RecipeFeed[RecipeFeed.tsx]
        Recipe --> RecommendedRecipes[RecommendedRecipes.tsx]
        Recipe --> RecommendationExplanation[RecommendationExplanation.tsx]
    end

    subgraph Configuration
        Root --> TailwindConfig[tailwind.config.js]
        Root --> MetroConfig[metro.config.js]
        Root --> BabelConfig[babel.config.js]
        Root --> TsConfig[tsconfig.json]
        Root --> EasJson[eas.json]
    end

    subgraph Mobile
        App --> IOS[/ios/]
        App --> Android[/android/]
        App --> Assets[/assets/]
    end

    subgraph Documentation
        Root --> Docs[/docs/]
        Root --> Checklist[/checklist/]
        Root --> README[README.md]
    end

    %% Relationships
    Components --> Types
    Hooks --> Types
    Services --> Types
    AppDir --> Components
    Recipe --> Hooks
    Recipe --> Utils