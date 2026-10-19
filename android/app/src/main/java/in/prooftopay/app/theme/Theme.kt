package in.prooftopay.app.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.Color
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

enum class ThemeMode {
    LIGHT,
    DARK,
    SYSTEM
}

object ThemeRepository {
    private const val PREFS_NAME = "prooftopay_theme_prefs"
    private const val KEY_THEME = "selected_theme_mode"
    private var prefs: android.content.SharedPreferences? = null

    private val _themeMode = MutableStateFlow(ThemeMode.SYSTEM)
    val themeMode: StateFlow<ThemeMode> = _themeMode.asStateFlow()

    fun init(context: android.content.Context) {
        try {
            val sp = context.getSharedPreferences(PREFS_NAME, android.content.Context.MODE_PRIVATE)
            prefs = sp
            val saved = sp.getString(KEY_THEME, ThemeMode.SYSTEM.name)
            val mode = try {
                ThemeMode.valueOf(saved ?: ThemeMode.SYSTEM.name)
            } catch (_: Exception) {
                ThemeMode.SYSTEM
            }
            _themeMode.value = mode
        } catch (_: Exception) {
            // Fallback gracefully in testing environments
        }
    }

    fun setThemeMode(mode: ThemeMode) {
        _themeMode.value = mode
        try {
            prefs?.edit()?.putString(KEY_THEME, mode.name)?.apply()
        } catch (_: Exception) {
            // Ignore storage write error
        }
    }
}

private val LightColorScheme = lightColorScheme(
    primary = Emerald600,
    onPrimary = Color.White,
    primaryContainer = Emerald100,
    onPrimaryContainer = Emerald600,
    secondary = Indigo600,
    onSecondary = Color.White,
    background = SurfaceLight,
    surface = CardLight,
    surfaceVariant = Color(0xFFF1F5F9),
    onBackground = TextPrimary,
    onSurface = TextPrimary,
    onSurfaceVariant = TextSecondary,
    outline = BorderLight
)

private val DarkColorScheme = darkColorScheme(
    primary = Emerald500,
    onPrimary = Navy900,
    primaryContainer = Navy800,
    onPrimaryContainer = Emerald500,
    secondary = Indigo500,
    onSecondary = Color.White,
    background = Navy900,
    surface = Navy800,
    surfaceVariant = Color(0xFF243048),
    onBackground = Color.White,
    onSurface = Color.White,
    onSurfaceVariant = Color(0xFF94A3B8),
    outline = Navy700
)

@Composable
fun ProofToPayTheme(
    themeMode: ThemeMode = ThemeRepository.themeMode.collectAsState().value,
    content: @Composable () -> Unit
) {
    val darkTheme = when (themeMode) {
        ThemeMode.LIGHT -> false
        ThemeMode.DARK -> true
        ThemeMode.SYSTEM -> isSystemInDarkTheme()
    }
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
