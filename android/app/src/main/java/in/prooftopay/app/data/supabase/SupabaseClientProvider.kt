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

    val isConfigured: Boolean
        get() = (!customUrl.isNullOrBlank() && !customAnonKey.isNullOrBlank()) ||
                (BuildConfig.SUPABASE_URL != "https://your-project.supabase.co" && BuildConfig.SUPABASE_ANON_KEY != "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key")

    fun setCredentials(url: String, anonKey: String) {
        customUrl = url
        customAnonKey = anonKey
        _client = null
    }

    private var _client: SupabaseClient? = null

    val client: SupabaseClient
        get() {
            if (_client == null) {
                val url = customUrl ?: BuildConfig.SUPABASE_URL
                val key = customAnonKey ?: BuildConfig.SUPABASE_ANON_KEY

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
