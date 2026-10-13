plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.serialization")
}

android {
    namespace = "in.prooftopay.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "in.prooftopay.app"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }

        // Supabase Public Client Credentials
        // Dynamically resolved from Gradle project properties (-PSUPABASE_URL=...),
        // local.properties, gradle.properties, or system environment variables (CI/CD or .env).
        // NEVER embed service-role keys or secret tokens.
        val localProperties = java.util.Properties().apply {
            val localPropsFile = rootProject.file("local.properties")
            if (localPropsFile.exists()) {
                localPropsFile.inputStream().use { load(it) }
            }
        }

        val resolvedSupabaseUrl: String = (project.findProperty("SUPABASE_URL") as? String)
            ?: (localProperties.getProperty("SUPABASE_URL") as? String)
            ?: System.getenv("SUPABASE_URL")
            ?: System.getenv("VITE_SUPABASE_URL")
            ?: ""

        val resolvedPublishableKey: String = (project.findProperty("SUPABASE_PUBLISHABLE_KEY") as? String)
            ?: (project.findProperty("SUPABASE_ANON_KEY") as? String)
            ?: (localProperties.getProperty("SUPABASE_PUBLISHABLE_KEY") as? String)
            ?: (localProperties.getProperty("SUPABASE_ANON_KEY") as? String)
            ?: System.getenv("SUPABASE_PUBLISHABLE_KEY")
            ?: System.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")
            ?: System.getenv("SUPABASE_ANON_KEY")
            ?: System.getenv("VITE_SUPABASE_ANON_KEY")
            ?: ""

        buildConfigField("String", "SUPABASE_URL", "\"$resolvedSupabaseUrl\"")
        buildConfigField("String", "SUPABASE_PUBLISHABLE_KEY", "\"$resolvedPublishableKey\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"$resolvedPublishableKey\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.14"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    // AndroidX & Core
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.3")
    implementation("androidx.activity:activity-compose:1.9.0")

    // Jetpack Compose & Material 3
    val composeBom = platform("androidx.compose:compose-bom:2024.06.00")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")

    // Navigation & Lifecycle ViewModel Compose
    implementation("androidx.navigation:navigation-compose:2.7.7")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.3")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.3")

    // Supabase Kotlin SDK v2.5+
    val supabaseVersion = "2.5.4"
    implementation("io.github.jan-tennert.supabase:postgrest-kt:$supabaseVersion")
    implementation("io.github.jan-tennert.supabase:gotrue-kt:$supabaseVersion")
    implementation("io.github.jan-tennert.supabase:storage-kt:$supabaseVersion")
    implementation("io.github.jan-tennert.supabase:realtime-kt:$supabaseVersion")

    // Ktor HTTP Client (Engine for Supabase)
    val ktorVersion = "2.3.12"
    implementation("io.ktor:ktor-client-okhttp:$ktorVersion")
    implementation("io.ktor:ktor-client-core:$ktorVersion")
    implementation("io.ktor:ktor-client-content-negotiation:$ktorVersion")
    implementation("io.ktor:ktor-serialization-kotlinx-json:$ktorVersion")

    // Serialization & Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")

    // Coil Image Loading for Compose
    implementation("io.coil-kt:coil-compose:2.6.0")

    // Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1")
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
