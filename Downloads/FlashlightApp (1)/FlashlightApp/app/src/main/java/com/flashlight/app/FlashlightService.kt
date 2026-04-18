package com.flashlight.app

import android.app.*
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.os.IBinder
import android.widget.RemoteViews
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

class FlashlightService : Service() {

    private lateinit var flashlight: FlashlightManager
    private lateinit var notificationManager: NotificationManagerCompat

    companion object {
        const val CHANNEL_ID = "flashlight_channel"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START = "com.flashlight.START"
        const val ACTION_STOP = "com.flashlight.STOP"
        const val ACTION_UPDATE = "com.flashlight.UPDATE"

        fun start(context: Context) {
            val intent = Intent(context, FlashlightService::class.java).apply {
                action = ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, FlashlightService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }

        fun update(context: Context) {
            val intent = Intent(context, FlashlightService::class.java).apply {
                action = ACTION_UPDATE
            }
            context.startService(intent)
        }
    }

    override fun onCreate() {
        super.onCreate()
        flashlight = FlashlightManager.getInstance(this)
        notificationManager = NotificationManagerCompat.from(this)
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                startForeground(NOTIFICATION_ID, buildNotification())
                updateNotification()
            }
            ACTION_STOP -> {
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
            ACTION_UPDATE -> {
                updateNotification()
            }
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Flashlight Controls",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Live flashlight intensity controls"
                setShowBadge(false)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    fun buildNotification(): Notification {
        val isOn = flashlight.isOn
        val intensity = flashlight.currentIntensity
        val supportsIntensity = flashlight.supportsIntensity()

        // Intent to open app
        val openAppIntent = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Toggle action
        val toggleIntent = PendingIntent.getBroadcast(
            this, 1,
            Intent(this, NotificationReceiver::class.java).apply {
                action = "com.flashlight.ACTION_TOGGLE"
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Intensity decrease
        val decreaseIntent = PendingIntent.getBroadcast(
            this, 2,
            Intent(this, NotificationReceiver::class.java).apply {
                action = "com.flashlight.ACTION_INTENSITY_DOWN"
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Intensity increase
        val increaseIntent = PendingIntent.getBroadcast(
            this, 3,
            Intent(this, NotificationReceiver::class.java).apply {
                action = "com.flashlight.ACTION_INTENSITY_UP"
            },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val toggleLabel = if (isOn) "Turn OFF" else "Turn ON"
        val statusText = if (isOn) "ON • Level $intensity/10" else "OFF"
        val intensityBar = buildIntensityBar(intensity, isOn)

        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(if (isOn) R.drawable.ic_flashlight_on else R.drawable.ic_flashlight_off)
            .setContentTitle("🔦 Flashlight $statusText")
            .setContentText(intensityBar)
            .setContentIntent(openAppIntent)
            .setOngoing(true)
            .setSilent(true)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setColor(if (isOn) Color.parseColor("#FFD700") else Color.GRAY)
            .addAction(
                R.drawable.ic_flashlight_on,
                toggleLabel,
                toggleIntent
            )

        if (supportsIntensity && isOn) {
            builder.addAction(R.drawable.ic_minus, "Dimmer (${intensity - 1})", decreaseIntent)
            builder.addAction(R.drawable.ic_plus, "Brighter (${intensity + 1})", increaseIntent)
        }

        return builder.build()
    }

    private fun buildIntensityBar(level: Int, isOn: Boolean): String {
        if (!isOn) return "Tap to activate"
        val filled = "█".repeat(level)
        val empty = "░".repeat(10 - level)
        return "Intensity: $filled$empty $level/10"
    }

    fun updateNotification() {
        try {
            notificationManager.notify(NOTIFICATION_ID, buildNotification())
        } catch (e: SecurityException) {
            // Notification permission not granted
        }
    }

    override fun onDestroy() {
        super.onDestroy()
    }
}
