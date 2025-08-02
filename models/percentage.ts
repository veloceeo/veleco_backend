import express from "express";

const route = express.Router();

function calculatePercentageForRange(range: number, category: string) {
  let add_on = 0;
  let percentage = "";
  let tier = "";
  
  // Range 0-499 (Basic)
  if (range >= 0 && range <= 499) {
    tier = "basic";
    switch (category) {
      case "human":
        add_on = 50;
        percentage = "10%";
        break;
      case "pet":
        add_on = 30;
        percentage = "8%";
        break;
      case "plant":
        add_on = 20;
        percentage = "5%";
        break;
      case "electronics":
        add_on = 50;
        percentage = "10%";
        break;
      case "baby-toys":
        add_on = 50;
        percentage = "16.666%";
        break;
      case "stationary":
        add_on = 20;
        percentage = "20%";
        break;
    }
  }
  
  // Range 500-999 (Premium)
  else if (range >= 500 && range <= 999) {
    tier = "premium";
    switch (category) {
      case "human":
        add_on = 80;
        percentage = "16%";
        break;
      case "pet":
        add_on = 80;
        percentage = "16%";
        break;
      case "plant":
        add_on = 50;
        percentage = "10%";
        break;
      case "electronics":
        add_on = 75;
        percentage = "7.5%";
        break;
      case "baby-toys":
        add_on = 75;
        percentage = "12.5%";
        break;
      case "stationary":
        add_on = 50;
        percentage = "10%";
        break;
    }
  }
  
  // Range 1000-1499
  else if (range >= 1000 && range <= 1499) {
    tier = "enterprise_basic";
    switch (category) {
      case "human":
        add_on = 200;
        percentage = "20%";
        break;
      case "pet":
        add_on = 150;
        percentage = "18%";
        break;
      case "plant":
        add_on = 100;
        percentage = "15%";
        break;
      case "electronics":
        add_on = 100;
        percentage = "5%";
        break;
      case "baby-toys":
        add_on = 100;
        percentage = "10%";
        break;
      case "stationary":
        add_on = 75;
        percentage = "5%";
        break;
    }
  }

  // Range 1500-1999
  else if (range >= 1500 && range <= 1999) {
    tier = "enterprise_premium";
    switch (category) {
      case "human":
        add_on = 250;
        percentage = "25%";
        break;
      case "pet":
        add_on = 200;
        percentage = "22%";
        break;
      case "plant":
        add_on = 150;
        percentage = "20%";
        break;
      case "electronics":
        add_on = 150;
        percentage = "2.5%";
        break;
      case "baby-toys":
        add_on = 150;
        percentage = "7.5%";
        break;
      case "stationary":
        add_on = 100;
        percentage = "2.5%";
        break;
    }
  }
  
  // Range 2000-2499
  else if (range >= 2000 && range <= 2499) {
    tier = "enterprise_advanced";
    switch (category) {
      case "human":
        add_on = 300;
        percentage = "30%";
        break;
      case "pet":
        add_on = 250;
        percentage = "28%";
        break;
      case "plant":
        add_on = 200;
        percentage = "25%";
        break;
      case "electronics":
        add_on = 100;
        percentage = "5%";
        break;
      case "baby-toys":
        add_on = 150;
        percentage = "7.5%";
        break;
      case "stationary":
        add_on = 100;
        percentage = "2.5%";
        break;
    }
  }
  
  // Range 2500-4999
  else if (range >= 2500 && range <= 4999) {
    tier = "enterprise_pro";
    switch (category) {
      case "electronics":
        add_on = 100;
        percentage = "5%";
        break;
      case "baby-toys":
        add_on = 150;
        percentage = "7.5%";
        break;
      case "stationary":
        add_on = 100;
        percentage = "2.5%";
        break;
    }
  }
  
  // Range 5000-9999
  else if (range >= 5000 && range <= 9999) {
    tier = "enterprise_elite";
    switch (category) {
      case "electronics":
        add_on = 150;
        percentage = "2.5%";
        break;
    }
  }
  
  // Range 10000+
  else if (range >= 10000) {
    tier = "enterprise_ultimate";
    switch (category) {
      case "electronics":
        add_on = 200;
        percentage = "1%";
        break;
    }
  }
  
  // Range 3000+ (for human, pet, plant)
  else if (range >= 3000) {
    tier = "enterprise_elite";
    switch (category) {
      case "human":
        add_on = 500;
        percentage = "35%";
        break;
      case "pet":
        add_on = 400;
        percentage = "32%";
        break;
      case "plant":
        add_on = 300;
        percentage = "30%";
        break;
    }
  }

  return {
    add_on,
    percentage,
    tier,
    range_category: getRangeCategory(range),
    category_type: category,
    calculated_at: new Date().toISOString()
  };
}



route.post("/add", async (req, res) => {
  try {
    const { categries_type, range } = req.body;
    
    if (!categries_type || range === undefined) {
       res.status(400).json({ error: "Missing required fields" });
       return;
    }


    // Validate category types
    const validCategories = ["human", "pet", "plant", "electronics", "baby-toys", "stationary"];
    if (!validCategories.includes(categries_type)) {
       res.status(400).json({ 
        message:"no add on for this category",
        error: `Invalid category type. Supported categories are: ${validCategories.join(", ")}`
      });
      return;
    }

    // Validate range
    if (range < 0) {
       res.status(400).json({ error: "Range must be a non-negative number" });
       return;
    }

    const responseData = calculatePercentageForRange(range, categries_type);
     res.json({
      success: true,
      data: responseData
    });
    return;

  } catch (error) {
    console.error("Error in percentage calculation:", error);
     res.status(500).json({ error: "Internal server error" });
      return;
  }
});

// Helper function to get range category name
function getRangeCategory(range: number): string {
  if (range >= 0 && range <= 499) return "basic";
  if (range >= 500 && range <= 999) return "premium";
  if (range >= 1000 && range <= 1499) return "enterprise_basic";
  if (range >= 1500 && range <= 1999) return "enterprise_premium";
  if (range >= 2000 && range <= 2499) return "enterprise_advanced";
  if (range >= 2500 && range <= 4999) return "enterprise_pro";
  if (range >= 5000 && range <= 9999) return "enterprise_elite";
  if (range >= 10000) return "enterprise_ultimate";
  return "unknown";
}

// Fixed other routes with proper return statements
route.get("/data", async (req, res) => {
  try {
    const configurations = {
      human: {
        "0-499": { add_on: 50, percentage: "10%", tier: "basic" },
        "500-999": { add_on: 80, percentage: "16%", tier: "premium" },
        "1000-1499": { add_on: 200, percentage: "20%", tier: "enterprise_basic" },
        "1500-1999": { add_on: 250, percentage: "25%", tier: "enterprise_premium" },
        "2000-2499": { add_on: 300, percentage: "30%", tier: "enterprise_advanced" },
        "3000+": { add_on: 500, percentage: "35%", tier: "enterprise_elite" }
      },
      pet: {
        "0-499": { add_on: 30, percentage: "8%", tier: "basic" },
        "500-999": { add_on: 80, percentage: "16%", tier: "premium" },
        "1000-1499": { add_on: 150, percentage: "18%", tier: "enterprise_basic" },
        "1500-1999": { add_on: 200, percentage: "22%", tier: "enterprise_premium" },
        "2000-2499": { add_on: 250, percentage: "28%", tier: "enterprise_advanced" },
        "3000+": { add_on: 400, percentage: "32%", tier: "enterprise_elite" }
      },
      plant: {
        "0-499": { add_on: 20, percentage: "5%", tier: "basic" },
        "500-999": { add_on: 50, percentage: "10%", tier: "premium" },
        "1000-1499": { add_on: 100, percentage: "15%", tier: "enterprise_basic" },
        "1500-1999": { add_on: 150, percentage: "20%", tier: "enterprise_premium" },
        "2000-2499": { add_on: 200, percentage: "25%", tier: "enterprise_advanced" },
        "3000+": { add_on: 300, percentage: "30%", tier: "enterprise_elite" }
      },
      electronics: {
        "0-499": { add_on: 50, percentage: "10%", tier: "basic" },
        "500-999": { add_on: 75, percentage: "7.5%", tier: "premium" },
        "1000-4999": { add_on: 100, percentage: "5%", tier: "enterprise" },
        "5000-9999": { add_on: 150, percentage: "2.5%", tier: "enterprise_elite" },
        "10000+": { add_on: 200, percentage: "1%", tier: "enterprise_ultimate" }
      },
      "baby-toys": {
        "0-499": { add_on: 50, percentage: "16.666%", tier: "basic" },
        "500-999": { add_on: 75, percentage: "12.5%", tier: "premium" },
        "1000-1499": { add_on: 100, percentage: "10%", tier: "enterprise_basic" },
        "1500+": { add_on: 150, percentage: "7.5%", tier: "enterprise_premium" }
      },
      stationary: {
        "0-199": { add_on: 20, percentage: "20%", tier: "basic" },
        "200-499": { add_on: 30, percentage: "15%", tier: "premium" },
        "500-999": { add_on: 50, percentage: "10%", tier: "enterprise_basic" },
        "1000-1499": { add_on: 75, percentage: "5%", tier: "enterprise_premium" },
        "1500+": { add_on: 100, percentage: "2.5%", tier: "enterprise_elite" }
      }
    };
    
     res.json({
      success: true,
      configurations
    });
    return
  } catch (error) {
    console.error("Error fetching configurations:", error);
     res.status(500).json({ error: "Internal server error" });
     return;
  }
});

route.get("/calculate", async (req, res) => {
  try {
    const { category, range } = req.query;
    
    if (!category || range === undefined) {
       res.status(400).json({ error: "Missing category or range parameters" });
        return;
    }
    
    const numRange = parseInt(range as string);
    if (isNaN(numRange) || numRange < 0) {
       res.status(400).json({ error: "Range must be a valid non-negative number" });
        return;
    }
    
    const validCategories = ["human", "pet", "plant", "electronics", "baby-toys", "stationary"];
    if (!validCategories.includes(category as string)) {
       res.status(400).json({ 
        error: "Invalid category type",
        valid_categories: validCategories
      });
        return;
    }
    
    const result = calculatePercentageForRange(numRange, category as string);
     res.json({
      success: true,
      result
    });
    return
    
  } catch (error) {
    console.error("Error calculating percentage:", error);
     res.status(500).json({ error: "Internal server error" });
     return;
  }
});

route.put("/update", async (req, res) => {
  try {
    const { category, range_type, add_on, percentage } = req.body;
    
    if (!category || !range_type || !add_on || !percentage) {
       res.status(400).json({ error: "Missing required fields" });
        return;
    }

    // Update the configuration logic here

     res.json({
      success: true,
      message: "Configuration updated successfully",
      updated: {
        category,
        range_type,
        add_on,
        percentage
      }
    });
    return;
    
  } catch (error) {
    console.error("Error updating configuration:", error);
     res.status(500).json({ error: "Internal server error" });
     return;
  }
});

export default route;