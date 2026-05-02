package com.nowbrief.services

import android.app.*
import android.content.Context
import android.content.Intent
import android.graphics.drawable.Icon
import android.os.*
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.os.bundleOf
import com.nowbrief.R
import com.nowbrief.activities.NowBriefActivity
import com.nowbrief.receivers.NotificationActionReceiver
import com.nowbrief.utils.GeminiHelper
import com.nowbrief.utils.WeatherHelper
import kotlinx.coroutines.*
import java.text.SimpleDateFormat
import java.util.*

class NowBriefLiveService : Service() {

    companion object {
        const val CHANNEL_ID = "nowbrief_live_channel"
        const val NOTIFICATION_ID = 1001
        const val TAG = "NowBriefLiveService"
        const val ACTION_START = "com.nowbrief.START_SERVICE"
        const val ACTION_STOP = "com.nowbrief.STOP_SERVICE"
        const val ACTION_UPDATE = "com.nowbrief.UPDATE_NOTIFICATION"

        // Greeting messages that cycle
        val GREETING_MESSAGES = listOf(
            "☀️ Good morning! Ready for the day?",
            "🌤️ Looks like a great day ahead!",
            "☕ Time to start your day right!",
            "🌸 Wishing you a wonderful day!",
            "⚡ Stay energized and focused!",
            "🎯 You've got this today!",
            "🌟 Make today count!",
            "💫 Hope your day is amazing!",
            "🍃 Breathe in, new day begins!",
            "🎵 Start your day with good vibes!"
        )

        val EVENING_MESSAGES = listOf(
            "🌙 Good evening! How was your day?",
            "🌆 Wind down and relax!",
            "⭐ Another great day done!",
            "🌛 Rest well tonight!",
            "🍵 Time to unwind and recharge!"
        )
    }

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var updateJob: Job? = null
    private var currentMessageIndex = 0
    private var currentWeatherSummary = "Fetching weather..."
    private var currentAiSummary = "Loading your brief..."
    private var handler = Handler(Looper.getMainLooper())
    private var notificationUpdateRunnable: Runnable? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        Log.d(TAG, "NowBriefLiveService created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopSelf()
                return START_NOT_STICKY
            }
            ACTION_UPDATE -> {
                refreshData()
            }
            else -> {
                startForegroundWithLiveNotification()
                startPeriodicUpdates()
                refreshData()
            }
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
        notificationUpdateRunnable?.let { handler.removeCallbacks(it) }
        Log.d(TAG, "NowBriefLiveService destroyed")
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "NowBrief Live Updates",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Real-time briefings and smart notifications"
                setShowBadge(false)
                enableLights(false)
                enableVibration(false)
                setSound(null, null)
            }
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun startForegroundWithLiveNotification() {
        val notification = buildLiveNotification(
            primaryText = getCurrentGreeting(),
            secondaryText = "Tap to open your daily brief",
            weatherLine = currentWeatherSummary
        )
        startForeground(NOTIFICATION_ID, notification)
    }

    private fun buildLiveNotification(
        primaryText: String,
        secondaryText: String,
        weatherLine: String = "",
        progress: Int = -1,
        progressMax: Int = 100
    ): Notification {
        val context: Context = this

        // Open NowBrief dedicated activity
        val openIntent = Intent(this, NowBriefActivity::class.java).apply {
            action = "com.nowbrief.OPEN_NOWBRIEF"
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val openPendingIntent = PendingIntent.getActivity(
            this, 0, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Dismiss action
        val dismissIntent = Intent(this, NotificationActionReceiver::class.java).apply {
            action = "com.nowbrief.ACTION_DISMISS"
        }
        val dismissPendingIntent = PendingIntent.getBroadcast(
            this, 1, dismissIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Next tip action
        val nextIntent = Intent(this, NotificationActionReceiver::class.java).apply {
            action = "com.nowbrief.ACTION_NEXT"
        }
        val nextPendingIntent = PendingIntent.getBroadcast(
            this, 2, nextIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Samsung Live Notifications Bundle
        val extras = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            bundleOf(
                // Required: Mark as Live Notification
                "android.ongoingActivityNoti.style" to 1,

                // Standard style - primary and secondary info
                "android.ongoingActivityNoti.primaryInfo" to primaryText,
                "android.ongoingActivityNoti.secondaryInfo" to if (weatherLine.isNotEmpty()) weatherLine else secondaryText,

                // Chip (Now Bar) configuration
                "android.ongoingActivityNoti.chipBgColor" to context.getColor(android.R.color.holo_blue_dark),
                "android.ongoingActivityNoti.chipExpandedText" to primaryText,

                // Action buttons for Live Notifications
                "android.ongoingActivityNoti.actionType" to 1,
                "android.ongoingActivityNoti.actionPrimarySet" to 0,
            ).also { bundle ->
                // Add progress if specified
                if (progress >= 0) {
                    bundle.putInt("android.ongoingActivityNoti.progress", progress)
                    bundle.putInt("android.ongoingActivityNoti.progressMax", progressMax)
                }

                // Add chip icon
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    bundle.putParcelable(
                        "android.ongoingActivityNoti.chipIcon",
                        Icon.createWithResource(context, R.drawable.ic_nowbrief_chip)
                    )
                }
            }
        } else {
            Bundle()
        }

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_nowbrief_notification)
            .setContentTitle(primaryText)
            .setContentText(if (weatherLine.isNotEmpty()) weatherLine else secondaryText)
            .setContentIntent(openPendingIntent)
            .setOngoing(true)
            .setSilent(true)
            .setCategory(NotificationCompat.CATEGORY_STATUS)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .addAction(R.drawable.ic_next, "Next", nextPendingIntent)
            .addAction(R.drawable.ic_close, "Dismiss", dismissPendingIntent)
            .setExtras(extras)
            .setStyle(NotificationCompat.BigTextStyle()
                .bigText("$primaryText\n$weatherLine\n$secondaryText")
                .setBigContentTitle("NowBrief")
                .setSummaryText("Your daily intelligence brief"))
            .build()
    }

    private fun updateLiveNotification(
        primaryText: String,
        secondaryText: String = currentAiSummary,
        weatherLine: String = currentWeatherSummary
    ) {
        val notification = buildLiveNotification(primaryText, secondaryText, weatherLine)
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(NOTIFICATION_ID, notification)
    }

    private fun startPeriodicUpdates() {
        // Cycle through greeting messages every 45 seconds
        notificationUpdateRunnable = object : Runnable {
            override fun run() {
                currentMessageIndex = (currentMessageIndex + 1) % getMessageList().size
                val message = getMessageList()[currentMessageIndex]
                updateLiveNotification(
                    primaryText = message,
                    secondaryText = currentAiSummary,
                    weatherLine = currentWeatherSummary
                )
                handler.postDelayed(this, 45_000) // 45 seconds
            }
        }
        handler.postDelayed(notificationUpdateRunnable!!, 45_000)
    }

    private fun refreshData() {
        serviceScope.launch {
            try {
                // Fetch weather
                val weather = WeatherHelper.getWeatherSummary(applicationContext)
                currentWeatherSummary = weather

                // Fetch AI brief from Gemini
                val aiSummary = GeminiHelper.getDailyBrief(applicationContext, weather)
                currentAiSummary = aiSummary

                // Update notification on main thread
                withContext(Dispatchers.Main) {
                    updateLiveNotification(
                        primaryText = getCurrentGreeting(),
                        secondaryText = currentAiSummary,
                        weatherLine = currentWeatherSummary
                    )
                }

                Log.d(TAG, "Data refreshed successfully")
            } catch (e: Exception) {
                Log.e(TAG, "Error refreshing data: ${e.message}")
            }
        }
    }

    private fun getCurrentGreeting(): String {
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        val messages = when {
            hour in 5..11 -> GREETING_MESSAGES
            hour in 12..17 -> listOf("🌞 Good afternoon!", "☀️ Hope your day is going well!", "💪 Afternoon energy boost!", "🎯 Keep crushing it!")
            else -> EVENING_MESSAGES
        }
        return messages[currentMessageIndex % messages.size]
    }

    private fun getMessageList(): List<String> {
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        return when {
            hour in 5..11 -> GREETING_MESSAGES
            hour in 12..17 -> listOf("🌞 Good afternoon!", "☀️ Hope your day is going well!", "💪 Afternoon energy boost!", "🎯 Keep crushing it!")
            else -> EVENING_MESSAGES
        }
    }
}
