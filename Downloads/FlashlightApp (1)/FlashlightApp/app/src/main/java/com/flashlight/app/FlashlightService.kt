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
        const val CHANNEL_ID = "flashlight_live"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START = "com.flashlight.START"
        const val ACTION_STOP  = "com.flashlight.STOP"
        const val ACTION_UPDATE = "com.flashlight.UPDATE"

        fun start(context: Context) {
            val i = Intent(context, FlashlightService::class.java).apply { action = ACTION_START }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(i)
            else context.startService(i)
        }

        fun stop(context: Context) {
            context.startService(Intent(context, FlashlightService::class.java).apply { action = ACTION_STOP })
        }

        fun update(context: Context) {
            context.startService(Intent(context, FlashlightService::class.java).apply { action = ACTION_UPDATE })
        }
    }

    override fun onCreate() {
        super.onCreate()
        flashlight = FlashlightManager.getInstance(this)
        notificationManager = NotificationManagerCompat.from(this)
        createChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                startForeground(NOTIFICATION_ID, buildNotification())
            }
            ACTION_STOP -> {
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
                return START_NOT_STICKY
            }
            ACTION_UPDATE -> updateNotification()
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    // ─────────────────────────────────────────
    // Channel
    // ─────────────────────────────────────────
    private fun createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val ch = NotificationChannel(
                CHANNEL_ID,
                "Flashlight Live",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Live flashlight intensity controls"
                setShowBadge(false)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            (getSystemService(NotificationManager::class.java)).createNotificationChannel(ch)
        }
    }

    // ─────────────────────────────────────────
    // Build live notification with RemoteViews
    // ─────────────────────────────────────────
    fun buildNotification(): Notification {
        val isOn      = flashlight.isOn
        val intensity = flashlight.currentIntensity

        // ── Intents ──
        val openApp = pendingActivity(0, Intent(this, MainActivity::class.java))
        val toggle  = pendingBroadcast(1, "com.flashlight.ACTION_TOGGLE")
        val dimmer  = pendingBroadcast(2, "com.flashlight.ACTION_INTENSITY_DOWN")
        val brighter = pendingBroadcast(3, "com.flashlight.ACTION_INTENSITY_UP")

        // ── Compact RemoteViews ──
        val compact = RemoteViews(packageName, R.layout.notification_compact).apply {
            setImageViewResource(R.id.notif_icon,
                if (isOn) R.drawable.ic_flashlight_on else R.drawable.ic_flashlight_off)
            setTextViewText(R.id.notif_title, "🔦 Flashlight")
            setTextViewText(R.id.notif_status,
                if (isOn) "ON  •  Level $intensity/10" else "OFF")
            setTextColor(R.id.notif_status,
                if (isOn) Color.parseColor("#FBBF24") else Color.parseColor("#888888"))
            setTextViewText(R.id.notif_toggle_btn, if (isOn) "Turn OFF" else "Turn ON")
            setOnClickPendingIntent(R.id.notif_toggle_btn, toggle)
            setOnClickPendingIntent(R.id.notif_icon, openApp)
        }

        // ── Expanded RemoteViews ──
        val expanded = RemoteViews(packageName, R.layout.notification_expanded).apply {
            setImageViewResource(R.id.notif_exp_icon,
                if (isOn) R.drawable.ic_flashlight_on else R.drawable.ic_flashlight_off)
            setTextViewText(R.id.notif_exp_badge, if (isOn) "ON" else "OFF")
            setTextColor(R.id.notif_exp_badge,
                if (isOn) Color.parseColor("#FBBF24") else Color.parseColor("#888888"))
            setInt(R.id.notif_exp_badge, "setBackgroundColor",
                if (isOn) Color.parseColor("#2A2200") else Color.parseColor("#2A2A2A"))

            // Live progress bar
            setProgressBar(R.id.notif_intensity_bar, 10, intensity, false)

            setTextViewText(R.id.notif_exp_intensity_label,
                if (isOn) "Intensity  $intensity / 10" else "Turn on to adjust intensity")

            // Buttons
            setTextViewText(R.id.notif_btn_toggle, if (isOn) "⏻  Turn OFF" else "⏻  Turn ON")
            setTextColor(R.id.notif_btn_toggle,
                if (isOn) Color.parseColor("#FF6B6B") else Color.parseColor("#FBBF24"))

            setOnClickPendingIntent(R.id.notif_btn_toggle, toggle)
            setOnClickPendingIntent(R.id.notif_btn_down,   dimmer)
            setOnClickPendingIntent(R.id.notif_btn_up,     brighter)

            // Dim dimmer/brighter buttons when off
            setFloat(R.id.notif_btn_down, "setAlpha", if (isOn && intensity > 1)  1f else 0.35f)
            setFloat(R.id.notif_btn_up,   "setAlpha", if (isOn && intensity < 10) 1f else 0.35f)
        }

        // ── Build notification ──
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(if (isOn) R.drawable.ic_flashlight_on else R.drawable.ic_flashlight_off)
            .setContentTitle("Flashlight")
            .setContentText(if (isOn) "ON • Level $intensity/10" else "OFF")
            .setCustomContentView(compact)
            .setCustomBigContentView(expanded)
            .setStyle(NotificationCompat.DecoratedCustomViewStyle())
            .setContentIntent(openApp)
            .setOngoing(true)
            .setSilent(true)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setColor(if (isOn) Color.parseColor("#FBBF24") else Color.GRAY)
            .build()
    }

    fun updateNotification() {
        try {
            notificationManager.notify(NOTIFICATION_ID, buildNotification())
        } catch (e: SecurityException) {
            // No notification permission
        } catch (e: Exception) {
            // ignore
        }
    }

    // ─────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────
    private fun pendingActivity(reqCode: Int, intent: Intent): PendingIntent =
        PendingIntent.getActivity(this, reqCode, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

    private fun pendingBroadcast(reqCode: Int, action: String): PendingIntent =
        PendingIntent.getBroadcast(
            this, reqCode,
            Intent(this, NotificationReceiver::class.java).apply { this.action = action },
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
}
