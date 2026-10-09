package in.prooftopay.app.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColorScheme = lightColorScheme(
    primary = Emerald600,
    onPrimary = Color.White,
    primaryContainer = Emerald100,
    onPrimaryContainer = Emerald600,
    secondary = Indigo600,
    onSecondary = Color.White,
    background = SurfaceLight,
    surface = CardLight,
    onBackground = TextPrimary,
    onSurface = TextPrimary,
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
    onBackground = Color.White,
    onSurface = Color.White,
    outline = Navy700
)

@Composable
fun ProofToPayTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
