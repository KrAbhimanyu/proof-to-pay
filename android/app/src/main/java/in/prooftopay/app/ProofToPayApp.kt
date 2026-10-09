package in.prooftopay.app

import android.app.Application

class ProofToPayApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // App-level initialization (e.g. Supabase, analytics, crashlytics)
    }
}
