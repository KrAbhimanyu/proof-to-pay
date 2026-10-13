package in.prooftopay.app.data.supabase

import in.prooftopay.app.BuildConfig
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.gotrue.Auth
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.realtime.Realtime
import io.github.jan.supabase.realtime.realtime
import io.github.jan.supabase.storage.Storage
import io.github.jan.supabase.storage.storage

object SupabaseClientProvider {

    // Configured via BuildConfig or runtime properties
    private var customUrl: String? = null
    private var customAnonKey: String? = null

    private fun isPlaceholder(value: String?): Boolean {
        if (value.isNullOrBlank()) return true
        val lower = value.lowercase()
        return lower.contains("your-project") ||
                lower.contains("dummy_anon_key") ||
                lower.contains("placeholder") ||
                lower.contains("change-this")
    }

    val isConfigured: Boolean
        get() {
            val url = customUrl ?: BuildConfig.SUPABASE_URL
            val key = customAnonKey ?: BuildConfig.SUPABASE_PUBLISHABLE_KEY.ifEmpty { BuildConfig.SUPABASE_ANON_KEY }
            return !isPlaceholder(url) && !isPlaceholder(key) && url.startsWith("http")
        }

    fun setCredentials(url: String, anonKey: String) {
        customUrl = url.trim()
        customAnonKey = anonKey.trim()
        _client = null
    }

    private var _client: SupabaseClient? = null

    val client: SupabaseClient
        get() {
            if (!isConfigured) {
                throw IllegalStateException(
                    "Supabase backend is not configured for Android. " +
                    "Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in android/gradle.properties " +
                    "or system environment variables. Never embed service-role keys in the APK."
                )
            }

            if (_client == null) {
                val url = (customUrl ?: BuildConfig.SUPABASE_URL).trim()
                val key = (customAnonKey ?: BuildConfig.SUPABASE_PUBLISHABLE_KEY.ifEmpty { BuildConfig.SUPABASE_ANON_KEY }).trim()

                _client = createSupabaseClient(
                    supabaseUrl = url,
                    supabaseKey = key
                ) {
                    install(Auth)
                    install(Postgrest)
                    install(Storage)
                    install(Realtime)
                }
            }
            return _client!!
        }

    val auth get() = client.auth
    val postgrest get() = client.postgrest
    val storage get() = client.storage
    val realtime get() = client.realtime
}
