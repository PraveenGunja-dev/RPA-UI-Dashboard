import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface CompanyNotification {
  id: string;
  name: string;
  count: number;
  color: string;
}

// Function to assign a color based on the entity name for visual distinction
const getColorForEntity = (entityName: string): string => {
  // Define a set of colors to cycle through
  const colors = [
    "#3B82F6", // blue-500
    "#10B981", // emerald-500
    "#8B5CF6", // violet-500
    "#EC4899", // pink-500
    "#F59E0B", // amber-500
    "#EF4444", // red-500
    "#06B6D4", // cyan-500
    "#84CC16"  // lime-500
  ];
  
  // Generate a consistent hash from the entity name to pick a color
  let hash = 0;
  for (let i = 0; i < entityName.length; i++) {
    hash = entityName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use the hash to select a color from the array
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Function to fetch BSE alerts data and process entity counts
const fetchEntityNotificationData = async (): Promise<CompanyNotification[]> => {
  try {
    // Use relative path since frontend and backend are served from the same origin
    // Fetch BSE alerts data from the notifications database
    const response = await fetch(`/bse-alerts?limit=1000&offset=0`);
    if (!response.ok) {
      throw new Error("Failed to fetch BSE alerts data");
    }
    const data = await response.json();
    
    // Process data to get entity counts
    const entityMap: { [key: string]: number } = {};
    data.data.forEach((item: any) => {
      const entityName = item.entity_name || "Unknown Entity";
      // Filter out "Total" entities as per user preference
      if (entityName.toUpperCase() !== "TOTAL") {
        if (!entityMap[entityName]) {
          entityMap[entityName] = 0;
        }
        entityMap[entityName] += 1;
      }
    });
    
    // Convert to array format and sort by count descending
    const entityNames = Object.keys(entityMap);
    const entityData: CompanyNotification[] = entityNames.map((entityName, index) => ({
      id: `entity-${index}`, // Generate a unique ID
      name: entityName,
      count: entityMap[entityName],
      // Assign a color based on the entity name for visual distinction
      color: getColorForEntity(entityName)
    })).sort((a, b) => b.count - a.count);
    
    return entityData;
  } catch (error) {
    console.error("Error fetching entity notification data:", error);
    return []; // Return empty array on error
  }
};

const NotificationBar = () => {
  const [companyNotifications, setCompanyNotifications] = useState<CompanyNotification[]>([]);
  
  useEffect(() => {
    const loadNotifications = async () => {
      const data = await fetchEntityNotificationData();
      setCompanyNotifications(data);
    };
    
    loadNotifications();
  }, []);

  // Create a repeated array for seamless marquee effect
  const repeatedNotifications = [...companyNotifications, ...companyNotifications, ...companyNotifications];

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full h-14 flex items-center px-6 relative overflow-hidden"
      style={{
        background: "rgba(0, 0, 0, 0.95)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(0, 0, 0, 0.5)"
      }}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-20">
        <motion.div
          animate={{
            x: ["0%", "100%"]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear"
          }}
          className="w-full h-full"
          style={{
            background: "repeating-linear-gradient(90deg, transparent 0px, rgba(255, 255, 255, 0.1) 50px, transparent 100px)"
          }}
        />
      </div>

      {/* Marquee Notifications Section */}
      <div className="relative z-10 w-full overflow-hidden">
        <motion.div
          className="flex items-center gap-8 whitespace-nowrap"
          animate={{
            x: ["100%", "-100%"]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {repeatedNotifications.map((company, index) => (
            <motion.div
              key={`${company.id}-${index}`}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full border inline-flex"
              style={{
                backgroundColor: `${company.color}20`,
                borderColor: `${company.color}60`
              }}
              whileHover={{
                scale: 1.05,
                backgroundColor: `${company.color}30`
              }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-sm font-semibold" style={{ color: 'white' }}>
                {company.name} 
              </span>
              <motion.span 
                className="text-sm font-bold px-2 py-0.5 rounded-full min-w-[24px] text-center"
                style={{ 
                  backgroundColor: company.color,
                  color: 'white'
                }}
                animate={{
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: Math.random() * 2
                }}
              >
                {company.count}
              </motion.span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default NotificationBar;