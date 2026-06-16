"use client";

import { motion } from "framer-motion";
import { Activity, Brain, CheckCircle } from "lucide-react";
import { fadeInUp } from "@/lib/motion";

interface Event {
  time: string;
  icon: "Activity" | "Brain" | "Check";
  text: string;
}

const iconMap = {
  Activity: Activity,
  Brain: Brain,
  Check: CheckCircle,
};

const iconColors = {
  Activity: "text-[#1e7fb0] bg-[#1e7fb0]/10",
  Brain: "text-purple-500 bg-purple-50",
  Check: "text-green-500 bg-green-50",
};

export default function EventTimeline({ events }: { events: Event[] }) {
  return (
    <motion.div
      className="space-y-0"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-20px" }}
    >
      {events.map((event, i) => {
        const Icon = iconMap[event.icon];
        return (
          <motion.div key={event.time + event.text} className="flex gap-3" variants={fadeInUp} custom={i}>
            <div className="flex flex-col items-center">
              <motion.div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${iconColors[event.icon]}`}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: i * 0.1 }}
              >
                <Icon size={14} />
              </motion.div>
              {i < events.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1" />}
            </div>
            <div className="pb-5 pt-1">
              <p className="text-xs text-gray-400 font-mono">{event.time}</p>
              <p className="text-sm text-gray-700 mt-0.5">{event.text}</p>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
