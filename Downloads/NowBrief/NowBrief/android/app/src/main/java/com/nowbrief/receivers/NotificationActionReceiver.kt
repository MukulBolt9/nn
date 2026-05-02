package com.nowbrief.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import com.nowbrief.services.NowBriefLiveService

class NotificationActionReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            "com.nowbrief.ACTION_DISMISS" -> {
                Log.d("NotifActionReceiver", "Dismiss action received")
                // We keep the service running but can snooze messages
                // For Samsung Live Notifications, we don't actually stop the service
            }
            "com.nowbrief.ACTION_NEXT" -> {
                Log.d("NotifActionReceiver", "Next action - cycling message")
                val serviceIntent = Intent(context, NowBriefLiveService::class.java).apply {
                    action = NowBriefLiveService.ACTION_UPDATE
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent)
                } else {
                    context.startService(serviceIntent)
                }
            }
            "com.nowbrief.ACTION_OPEN" -> {
                Log.d("NotifActionReceiver", "Open action received")
                // Already handled by contentIntent
            }
        }
    }
}

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        Log.d("AlarmReceiver", "Scheduled update triggered")
        val serviceIntent = Intent(context, NowBriefLiveService::class.java).apply {
            action = NowBriefLiveService.ACTION_UPDATE
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent)
        } else {
            context.startService(serviceIntent)
        }
    }
}
