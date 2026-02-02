import { motion } from "framer-motion";
import BSEAlertsDashboardLayout from "@/components/layout/BSEAlertsDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import NotificationBar from "@/components/ui/NotificationBar";

const MasterData = () => {
  return (
    <BSEAlertsDashboardLayout>
      {/* Notification Bar at top of page */}
      <NotificationBar />
      
      <div className="min-h-screen p-8" style={{
        background: "#FFFFFF"
      }}>
        {/* Header with shadcn Card */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pb-4">
              <CardTitle className="text-4xl font-bold mb-2 " style={{ color: "#010741" }}>
                MASTER DATA
              </CardTitle>
              <CardDescription className="text-lg" style={{ color: 'rgba(1, 7, 65, 0.8)' }}>
                Data management and configuration
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Content Cards with shadcn components */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {/* Card 1 */}
          <Card className="border-blue-400/20" style={{
            background: "#FFFFFF",
            borderColor: "rgba(70, 121, 142, 0.5)",
            boxShadow: "none"
          }}>
            <CardHeader>
              <CardTitle className="text-xl" style={{ color: '#46798E' }}>
                Entity Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription style={{ color: 'rgba(220, 146, 179, 0.8)' }}>
                Configure and manage system entities and their relationships.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Card 2 */}
          <Card className="border-purple-400/20" style={{
            background: "#FFFFFF",
            borderColor: "rgba(228, 166, 203, 0.5)",
            boxShadow: "none"
          }}>
            <CardHeader>
              <CardTitle className="text-xl" style={{ color: '#E4A6CB' }}>
                Data Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription style={{ color: 'rgba(220, 146, 179, 0.8)' }}>
                Manage connections to external data sources and APIs.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Card 3 */}
          <Card className="border-pink-400/20" style={{
            background: "#FFFFFF",
            borderColor: "rgba(126, 101, 158, 0.5)",
            boxShadow: "none"
          }}>
            <CardHeader>
              <CardTitle className="text-xl" style={{ color: '#7E659E' }}>
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription style={{ color: 'rgba(220, 146, 179, 0.8)' }}>
                System-wide settings and configuration parameters.
              </CardDescription>
            </CardContent>
          </Card>
        </motion.div>

        {/* Status Footer with Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="border-t pt-6 mt-8"
          style={{
            borderColor: 'rgba(70, 121, 142, 0.5)'
          }}
        >
          <div className="flex justify-center items-center gap-6 text-sm " style={{ color: 'rgba(1, 7, 65, 0.8)' }}>
            <span>PAGE: MASTER DATA</span>
            <Badge variant="outline" style={{ color: '#46798E', borderColor: 'rgba(70, 121, 142, 0.5)' }}>
              STATUS: READY
            </Badge>
            <span style={{ color: '#E4A6CB' }}>
              {new Date().toLocaleTimeString()}
            </span>
          </div>
        </motion.div>
      </div>
    </BSEAlertsDashboardLayout>
  );
};

export default MasterData;