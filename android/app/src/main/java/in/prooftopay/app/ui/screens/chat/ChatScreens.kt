package in.prooftopay.app.ui.screens.chat

import android.Manifest
import android.content.pm.PackageManager
import android.media.MediaPlayer
import android.media.MediaRecorder
import android.net.Uri
import android.os.Build
import android.provider.OpenableColumns
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import in.prooftopay.app.data.model.*
import in.prooftopay.app.viewmodel.ChatViewModel
import java.io.File

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatInboxScreen(
    currentUser: UserProfile,
    chatViewModel: ChatViewModel,
    onNavigateBack: () -> Unit,
    onNavigateToConversation: (String) -> Unit
) {
    val conversations by chatViewModel.conversations.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    var selectedFilter by remember { mutableStateOf("ALL") }

    val filteredList = remember(conversations, searchQuery, selectedFilter, currentUser.id) {
        conversations.filter { c ->
            val partnerName = if (c.businessId == currentUser.id) c.creatorName ?: "" else c.businessName ?: ""
            val matchesSearch = partnerName.contains(searchQuery, ignoreCase = true) ||
                    (c.projectTitle ?: "").contains(searchQuery, ignoreCase = true)

            if (!matchesSearch) return@filter false

            when (selectedFilter) {
                "PROJECT" -> c.conversationType == ConversationType.PROJECT
                "PRE_PROJECT" -> c.conversationType == ConversationType.PRE_PROJECT
                "UNREAD" -> c.unreadCount > 0
                else -> true
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Secure Messages",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Lock,
                                contentDescription = null,
                                modifier = Modifier.size(12.dp),
                                tint = Color(0xFF10B981)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "End-to-end RLS isolated",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Search Input
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                placeholder = { Text("Search conversations...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                singleLine = true,
                shape = RoundedCornerShape(14.dp)
            )

            // Filter Tabs
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf(
                    "ALL" to "All",
                    "PROJECT" to "Projects",
                    "PRE_PROJECT" to "Pre-Project",
                    "UNREAD" to "Unread"
                ).forEach { (key, label) ->
                    val isSelected = selectedFilter == key
                    FilterChip(
                        selected = isSelected,
                        onClick = { selectedFilter = key },
                        label = { Text(label, fontSize = 12.sp) },
                        shape = RoundedCornerShape(10.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            // Conversation List
            if (filteredList.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = Icons.Default.Email,
                            contentDescription = null,
                            modifier = Modifier.size(56.dp),
                            tint = MaterialTheme.colorScheme.outlineVariant
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "No conversations found",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.SemiBold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Conversations begin when you ask project questions or accept an offer.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(vertical = 4.dp)
                ) {
                    items(filteredList, key = { it.id }) { conv ->
                        val isPartnerBusiness = conv.creatorId == currentUser.id
                        val partnerName = if (isPartnerBusiness) conv.businessName ?: "Client" else conv.creatorName ?: "Creator"

                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onNavigateToConversation(conv.id) },
                            color = MaterialTheme.colorScheme.surface
                        ) {
                            Row(
                                modifier = Modifier
                                    .padding(horizontal = 16.dp, vertical = 12.dp)
                                    .fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // Avatar Circle
                                Box(
                                    modifier = Modifier
                                        .size(46.dp)
                                        .clip(CircleShape)
                                        .background(
                                            if (conv.conversationType == ConversationType.PROJECT)
                                                MaterialTheme.colorScheme.primaryContainer
                                            else
                                                MaterialTheme.colorScheme.secondaryContainer
                                        ),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = partnerName.take(1).uppercase(),
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 18.sp,
                                        color = if (conv.conversationType == ConversationType.PROJECT)
                                            MaterialTheme.colorScheme.onPrimaryContainer
                                        else
                                            MaterialTheme.colorScheme.onSecondaryContainer
                                    )
                                }

                                Spacer(modifier = Modifier.width(12.dp))

                                Column(modifier = Modifier.weight(1f)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = partnerName,
                                            style = MaterialTheme.typography.bodyMedium,
                                            fontWeight = if (conv.unreadCount > 0) FontWeight.Bold else FontWeight.SemiBold,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                        Text(
                                            text = conv.lastMessageAt.takeLast(8).take(5),
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.outline
                                        )
                                    }

                                    if (!conv.projectTitle.isNullOrBlank()) {
                                        Text(
                                            text = "📌 ${conv.projectTitle}",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.primary,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis,
                                            modifier = Modifier.padding(vertical = 1.dp)
                                        )
                                    }

                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = conv.lastMessageSnippet ?: "No messages yet",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = if (conv.unreadCount > 0) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.outline,
                                            fontWeight = if (conv.unreadCount > 0) FontWeight.Medium else FontWeight.Normal,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis,
                                            modifier = Modifier.weight(1f, fill = false)
                                        )

                                        if (conv.unreadCount > 0) {
                                            Badge(
                                                containerColor = MaterialTheme.colorScheme.primary,
                                                contentColor = MaterialTheme.colorScheme.onPrimary,
                                                modifier = Modifier.padding(start = 8.dp)
                                            ) {
                                                Text(conv.unreadCount.toString())
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f))
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatConversationScreen(
    conversationId: String,
    currentUser: UserProfile,
    chatViewModel: ChatViewModel,
    onNavigateBack: () -> Unit
) {
    val context = LocalContext.current
    LaunchedEffect(conversationId) {
        chatViewModel.selectConversation(conversationId, currentUser.id)
    }

    val activeConv by chatViewModel.activeConversation.collectAsState()
    val messages by chatViewModel.messages.collectAsState()
    val isUploading by chatViewModel.isUploading.collectAsState()
    val isSending by chatViewModel.isSending.collectAsState()
    val isLoadingMessages by chatViewModel.isLoadingMessages.collectAsState()
    val errorMessage by chatViewModel.errorMessage.collectAsState()

    var inputText by remember { mutableStateOf("") }
    val listState = rememberLazyListState()

    // Real Audio Recording State
    var isRecording by remember { mutableStateOf(false) }
    var recordingSeconds by remember { mutableStateOf(0) }
    var mediaRecorder by remember { mutableStateOf<MediaRecorder?>(null) }
    var audioRecordFile by remember { mutableStateOf<File?>(null) }
    var recordStartTime by remember { mutableStateOf(0L) }

    // Audio Playback State
    var playingMessageId by remember { mutableStateOf<String?>(null) }
    var mediaPlayer by remember { mutableStateOf<MediaPlayer?>(null) }

    DisposableEffect(conversationId) {
        onDispose {
            chatViewModel.leaveConversation(conversationId)
            mediaPlayer?.release()
            mediaPlayer = null
            try {
                mediaRecorder?.apply {
                    stop()
                    release()
                }
            } catch (_: Exception) {}
            mediaRecorder = null
            audioRecordFile?.delete()
        }
    }

    // Recording duration timer
    LaunchedEffect(isRecording) {
        if (isRecording) {
            recordingSeconds = 0
            while (isRecording) {
                kotlinx.coroutines.delay(1000L)
                recordingSeconds++
                if (recordingSeconds >= 180) {
                    break
                }
            }
        }
    }

    fun startAudioRecording() {
        if (currentUser.isSuspended) return
        try {
            val file = File(context.cacheDir, "voice_record_${System.currentTimeMillis()}.m4a")
            audioRecordFile = file
            val recorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(context)
            } else {
                @Suppress("DEPRECATION")
                MediaRecorder()
            }.apply {
                setAudioSource(MediaRecorder.AudioSource.MIC)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setAudioSamplingRate(44100)
                setAudioEncodingBitRate(96000)
                setOutputFile(file.absolutePath)
                prepare()
                start()
            }
            mediaRecorder = recorder
            recordStartTime = System.currentTimeMillis()
            isRecording = true
        } catch (e: Exception) {
            isRecording = false
            mediaRecorder = null
        }
    }

    fun stopAndSendRecording() {
        try {
            mediaRecorder?.apply {
                stop()
                release()
            }
        } catch (_: Exception) {}
        mediaRecorder = null
        isRecording = false

        val file = audioRecordFile
        if (file != null && file.exists() && file.length() > 0) {
            val duration = ((System.currentTimeMillis() - recordStartTime) / 1000).toInt().coerceAtLeast(1)
            val bytes = file.readBytes()
            file.delete()
            chatViewModel.sendRealVoiceNote(
                conversationId = conversationId,
                sender = currentUser,
                audioBytes = bytes,
                durationSeconds = duration
            )
        }
        audioRecordFile = null
    }

    fun cancelRecording() {
        try {
            mediaRecorder?.apply {
                stop()
                release()
            }
        } catch (_: Exception) {}
        mediaRecorder = null
        isRecording = false
        audioRecordFile?.delete()
        audioRecordFile = null
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            startAudioRecording()
        }
    }

    val filePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let { selectedUri ->
            try {
                var fileName = "attachment_${System.currentTimeMillis()}"
                context.contentResolver.query(selectedUri, null, null, null, null)?.use { cursor ->
                    val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                    if (cursor.moveToFirst() && nameIndex >= 0) {
                        fileName = cursor.getString(nameIndex)
                    }
                }
                val mimeType = context.contentResolver.getType(selectedUri) ?: "application/octet-stream"
                val bytes = context.contentResolver.openInputStream(selectedUri)?.use { it.readBytes() }
                if (bytes != null && bytes.isNotEmpty()) {
                    chatViewModel.sendAttachment(
                        conversationId = conversationId,
                        sender = currentUser,
                        fileBytes = bytes,
                        fileName = fileName,
                        mimeType = mimeType
                    )
                }
            } catch (_: Exception) {}
        }
    }

    fun toggleAudioPlayback(msgId: String, downloadUrl: String?) {
        if (downloadUrl.isNullOrBlank()) return
        if (playingMessageId == msgId) {
            mediaPlayer?.pause()
            mediaPlayer?.release()
            mediaPlayer = null
            playingMessageId = null
        } else {
            mediaPlayer?.release()
            try {
                val player = MediaPlayer().apply {
                    setDataSource(downloadUrl)
                    prepareAsync()
                    setOnPreparedListener { start() }
                    setOnCompletionListener {
                        playingMessageId = null
                        release()
                        mediaPlayer = null
                    }
                }
                mediaPlayer = player
                playingMessageId = msgId
            } catch (_: Exception) {
                playingMessageId = null
            }
        }
    }

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    val partnerName = remember(activeConv, currentUser.id) {
        val c = activeConv
        if (c != null) {
            if (c.businessId == currentUser.id) c.creatorName ?: "Creator" else c.businessName ?: "Client"
        } else "Chat"
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = partnerName,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1
                        )
                        activeConv?.projectTitle?.let { title ->
                            Text(
                                text = "Project: $title",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.primary,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    activeConv?.let { c ->
                        val isProject = c.conversationType == ConversationType.PROJECT
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = if (isProject)
                                MaterialTheme.colorScheme.primaryContainer
                            else
                                MaterialTheme.colorScheme.surfaceVariant,
                            modifier = Modifier.padding(end = 12.dp)
                        ) {
                            Text(
                                text = if (isProject) "PROJECT" else "PRE-PROJECT",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isProject)
                                    MaterialTheme.colorScheme.onPrimaryContainer
                                else
                                    MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        bottomBar = {
            Surface(
                shadowElevation = 8.dp,
                color = MaterialTheme.colorScheme.surface
            ) {
                Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)) {
                    // Suspension Banner
                    if (currentUser.isSuspended) {
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = MaterialTheme.colorScheme.errorContainer,
                            modifier = Modifier.fillMaxWidth().padding(bottom = 6.dp)
                        ) {
                            Text(
                                text = "⚠️ Account is suspended. Messaging and file uploads are disabled.",
                                color = MaterialTheme.colorScheme.onErrorContainer,
                                fontSize = 11.sp,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                            )
                        }
                    }

                    // Error Notice Banner
                    errorMessage?.let { err ->
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = MaterialTheme.colorScheme.errorContainer,
                            modifier = Modifier.fillMaxWidth().padding(bottom = 6.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = err,
                                    color = MaterialTheme.colorScheme.onErrorContainer,
                                    fontSize = 11.sp,
                                    modifier = Modifier.weight(1f)
                                )
                                TextButton(onClick = { chatViewModel.clearError() }) {
                                    Text("Dismiss", fontSize = 11.sp)
                                }
                            }
                        }
                    }

                    // Uploading In-Flight Indicator
                    if (isUploading) {
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = MaterialTheme.colorScheme.primaryContainer,
                            modifier = Modifier.fillMaxWidth().padding(bottom = 6.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                CircularProgressIndicator(modifier = Modifier.size(14.dp), strokeWidth = 2.dp)
                                Text(
                                    text = "Uploading attachment to private storage...",
                                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                                    fontSize = 11.sp
                                )
                            }
                        }
                    }

                    // Active Voice Recording Controls
                    if (isRecording) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Surface(
                                    shape = CircleShape,
                                    color = Color.Red,
                                    modifier = Modifier.size(10.dp)
                                ) {}
                                Text(
                                    text = "Recording: ${recordingSeconds}s / 180s",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp,
                                    color = MaterialTheme.colorScheme.error
                                )
                            }

                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                OutlinedButton(
                                    onClick = { cancelRecording() },
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text("Cancel", fontSize = 12.sp)
                                }
                                Button(
                                    onClick = { stopAndSendRecording() },
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text("Send Note", fontSize = 12.sp)
                                }
                            }
                        }
                    } else {
                        // Standard Input Row
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            // File attachment picker button
                            IconButton(
                                onClick = { filePickerLauncher.launch("*/*") },
                                enabled = !currentUser.isSuspended && !isUploading
                            ) {
                                Icon(
                                    Icons.Default.Share,
                                    contentDescription = "Attach File or Image",
                                    tint = MaterialTheme.colorScheme.primary
                                )
                            }

                            // Microphone recording button
                            IconButton(
                                onClick = {
                                    if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                                        startAudioRecording()
                                    } else {
                                        permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                                    }
                                },
                                enabled = !currentUser.isSuspended && !isUploading
                            ) {
                                Icon(
                                    Icons.Default.PlayArrow,
                                    contentDescription = "Record Voice Note",
                                    tint = MaterialTheme.colorScheme.secondary
                                )
                            }

                            // Text Field
                            OutlinedTextField(
                                value = inputText,
                                onValueChange = { inputText = it },
                                modifier = Modifier.weight(1f),
                                placeholder = { Text("Secure message...", fontSize = 13.sp) },
                                maxLines = 4,
                                enabled = !currentUser.isSuspended && !isUploading && !isSending,
                                shape = RoundedCornerShape(20.dp)
                            )

                            // Send Button
                            IconButton(
                                onClick = {
                                    if (inputText.isNotBlank()) {
                                        val textToSend = inputText
                                        inputText = ""
                                        chatViewModel.sendMessage(
                                            conversationId = conversationId,
                                            sender = currentUser,
                                            text = textToSend
                                        )
                                    }
                                },
                                enabled = inputText.isNotBlank() && !currentUser.isSuspended && !isUploading && !isSending
                            ) {
                                if (isSending) {
                                    CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                                } else {
                                    Icon(
                                        Icons.Default.Send,
                                        contentDescription = "Send",
                                        tint = if (inputText.isNotBlank() && !currentUser.isSuspended) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline
                                    )
                                }
                            }
                        }
                    }

                    Text(
                        text = "🔒 Participant-only isolated messages & attachments (max 20MB).",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.outline,
                        fontSize = 10.sp,
                        modifier = Modifier
                            .align(Alignment.CenterHorizontally)
                            .padding(top = 4.dp)
                    )
                }
            }
        }
    ) { paddingValues ->
        LazyColumn(
            state = listState,
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(vertical = 12.dp)
        ) {
            items(messages, key = { it.id }) { msg ->
                val isMine = msg.senderId == currentUser.id

                if (msg.messageType == MessageType.SYSTEM) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 6.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.7f)
                        ) {
                            Text(
                                text = "🔔 ${msg.body}",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                            )
                        }
                    }
                } else {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = if (isMine) Arrangement.End else Arrangement.Start
                    ) {
                        Surface(
                            shape = RoundedCornerShape(
                                topStart = 16.dp,
                                topEnd = 16.dp,
                                bottomStart = if (isMine) 16.dp else 2.dp,
                                bottomEnd = if (isMine) 2.dp else 16.dp
                            ),
                            color = if (isMine)
                                MaterialTheme.colorScheme.primary
                            else
                                MaterialTheme.colorScheme.surfaceVariant,
                            shadowElevation = 1.dp,
                            modifier = Modifier.widthIn(max = 280.dp)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                if (!isMine && !msg.senderName.isNullOrBlank()) {
                                    Text(
                                        text = msg.senderName,
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                    Spacer(modifier = Modifier.height(2.dp))
                                }

                                when (msg.messageType) {
                                    MessageType.TEXT -> {
                                        Text(
                                            text = msg.body ?: "",
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = if (isMine) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                    MessageType.VOICE -> {
                                        val firstAttachment = msg.attachments.firstOrNull()
                                        val isPlayingThis = playingMessageId == msg.id
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                                            modifier = Modifier.clickable {
                                                toggleAudioPlayback(msg.id, firstAttachment?.downloadUrl)
                                            }
                                        ) {
                                            FilledIconButton(
                                                onClick = {
                                                    toggleAudioPlayback(msg.id, firstAttachment?.downloadUrl)
                                                },
                                                modifier = Modifier.size(32.dp),
                                                colors = IconButtonDefaults.filledIconButtonColors(
                                                    containerColor = if (isMine) MaterialTheme.colorScheme.surface else MaterialTheme.colorScheme.primary
                                                )
                                            ) {
                                                Icon(
                                                    if (isPlayingThis) Icons.Default.Pause else Icons.Default.PlayArrow,
                                                    contentDescription = "Play voice note",
                                                    modifier = Modifier.size(18.dp),
                                                    tint = if (isMine) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onPrimary
                                                )
                                            }
                                            Column {
                                                Text(
                                                    text = msg.body ?: "Voice Note",
                                                    style = MaterialTheme.typography.bodySmall,
                                                    fontWeight = FontWeight.SemiBold,
                                                    color = if (isMine) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                                Text(
                                                    text = if (firstAttachment?.voiceDurationSeconds != null)
                                                        "${firstAttachment.voiceDurationSeconds}s · Audio"
                                                    else
                                                        "Voice Note",
                                                    style = MaterialTheme.typography.labelSmall,
                                                    color = if (isMine) MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.8f) else MaterialTheme.colorScheme.outline
                                                )
                                            }
                                        }
                                    }
                                    MessageType.IMAGE, MessageType.FILE -> {
                                        val firstAttachment = msg.attachments.firstOrNull()
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .clickable(enabled = firstAttachment?.downloadUrl != null) {
                                                    firstAttachment?.downloadUrl?.let { url ->
                                                        try {
                                                            val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, Uri.parse(url))
                                                            context.startActivity(intent)
                                                        } catch (_: Exception) {}
                                                    }
                                                }
                                        ) {
                                            Icon(
                                                if (msg.messageType == MessageType.IMAGE) Icons.Default.Share else Icons.Default.Info,
                                                contentDescription = null,
                                                tint = if (isMine) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.primary
                                            )
                                            Column(modifier = Modifier.weight(1f)) {
                                                Text(
                                                    text = firstAttachment?.fileName ?: (msg.body ?: "Attachment"),
                                                    style = MaterialTheme.typography.bodySmall,
                                                    fontWeight = FontWeight.SemiBold,
                                                    maxLines = 1,
                                                    overflow = TextOverflow.Ellipsis,
                                                    color = if (isMine) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                                Text(
                                                    text = if (firstAttachment != null)
                                                        "${(firstAttachment.fileSizeBytes / 1024).coerceAtLeast(1)} KB"
                                                    else
                                                        "Encrypted attachment",
                                                    style = MaterialTheme.typography.labelSmall,
                                                    color = if (isMine) MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.8f) else MaterialTheme.colorScheme.outline
                                                )
                                            }
                                            if (firstAttachment?.downloadUrl != null) {
                                                Icon(
                                                    Icons.Default.ArrowDownward,
                                                    contentDescription = "Download attachment",
                                                    tint = if (isMine) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.primary,
                                                    modifier = Modifier.size(16.dp)
                                                )
                                            }
                                        }
                                    }
                                    else -> {}
                                }

                                Spacer(modifier = Modifier.height(4.dp))
                                Row(
                                    modifier = Modifier.align(Alignment.End),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = msg.createdAt.takeLast(8).take(5),
                                        style = MaterialTheme.typography.labelSmall,
                                        fontSize = 10.sp,
                                        color = if (isMine) MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.7f) else MaterialTheme.colorScheme.outline
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
