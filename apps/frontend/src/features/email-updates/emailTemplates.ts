import { Smartphone, FileText, Layout, LucideIcon } from 'lucide-react';

export interface EmailTemplate {
  id: string;
  name: string;
  icon: LucideIcon;
  subject: string;
  body: string;
}

export const TEMPLATES: EmailTemplate[] = [
  {
    id: 'naina',
    name: 'Naina Travels',
    icon: Smartphone,
    subject: 'Travel in Comfort with Naina Tour & Travels',
    body: `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; color: #0A2540; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
  <!-- Header -->
  <div style="background-color: #0A2540; padding: 25px 30px; display: flex; align-items: center; justify-content: space-between;">
    <div style="display: flex; align-items: center;">
      <div style="width: 35px; height: 35px; background-color: #ffffff; border-radius: 4px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
        <span style="color: #0A2540; font-weight: 900; font-size: 20px;">N</span>
      </div>
      <span style="color: #ffffff; font-weight: 700; font-size: 18px; letter-spacing: 1px;">NAINA TRAVELS</span>
    </div>
    <div style="background-color: #FBBF24; color: #0A2540; padding: 6px 15px; border-radius: 20px; font-size: 12px; font-weight: 800;">CALL: +91 70489 20649</div>
  </div>

  <!-- Hero Section -->
  <div style="position: relative; background: linear-gradient(rgba(10, 37, 64, 0.8), rgba(10, 37, 64, 0.8)), url('https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=600'); background-size: cover; background-position: center; padding: 60px 40px; text-align: center; color: #ffffff;">
    <h1 style="margin: 0; font-size: 28px; font-weight: 800; font-family: 'Playfair Display', serif; line-height: 1.2;">Travel in Comfort &<br/>Arrive in Style</h1>
    <p style="margin: 15px 0 25px 0; font-size: 14px; color: #cbd5e1; max-width: 400px; margin-left: auto; margin-right: auto;">Premium taxi services for local, outstation, and airport transfers at the best prices.</p>
    <a href="https://api.whatsapp.com/send?phone=917048920649&text=Hello%20Naina%20Travels%2C%20I%20want%20to%20book%20a%20cab&hl=en&lang=en" style="display: inline-block; background-color: #FBBF24; color: #0A2540; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; transition: all 0.3s ease;">Book Your Ride Now</a>
  </div>

  <!-- Services Grid -->
  <div style="padding: 40px 30px; background-color: #F8FAFC;">
    <h2 style="margin: 0 0 25px 0; text-align: center; font-size: 20px; color: #0A2540;">Our Premium Services</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
      <div style="background-color: #ffffff; padding: 20px 10px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center;">
        <div style="font-size: 24px; margin-bottom: 10px;">🚕</div>
        <p style="margin: 0; font-weight: 700; font-size: 12px;">Outstation</p>
        <p style="margin: 5px 0 0 0; color: #FBBF24; font-weight: 800; font-size: 14px;">₹11/km</p>
      </div>
      <div style="background-color: #ffffff; padding: 20px 10px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center;">
        <div style="font-size: 24px; margin-bottom: 10px;">✈️</div>
        <p style="margin: 0; font-weight: 700; font-size: 12px;">Airport</p>
        <p style="margin: 5px 0 0 0; color: #FBBF24; font-weight: 800; font-size: 14px;">₹999/-</p>
      </div>
      <div style="background-color: #ffffff; padding: 20px 10px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center;">
        <div style="font-size: 24px; margin-bottom: 10px;">🏙️</div>
        <p style="margin: 0; font-weight: 700; font-size: 12px;">Local City</p>
        <p style="margin: 5px 0 0 0; color: #FBBF24; font-weight: 800; font-size: 14px;">₹999/-</p>
      </div>
    </div>
  </div>

  <!-- Trust Badges -->
  <div style="padding: 30px; border-top: 1px solid #f1f5f9;">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div style="text-align: center; flex: 1;">
        <div style="color: #FBBF24; font-size: 18px; margin-bottom: 5px;">🛡️</div>
        <p style="margin: 0; font-size: 10px; font-weight: 700; color: #64748b;">Verified Drivers</p>
      </div>
      <div style="text-align: center; flex: 1; border-left: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9;">
        <div style="color: #FBBF24; font-size: 18px; margin-bottom: 5px;">💎</div>
        <p style="margin: 0; font-size: 10px; font-weight: 700; color: #64748b;">Premium Fleet</p>
      </div>
      <div style="text-align: center; flex: 1;">
        <div style="color: #FBBF24; font-size: 18px; margin-bottom: 5px;">📞</div>
        <p style="margin: 0; font-size: 10px; font-weight: 700; color: #64748b;">24/7 Support</p>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div style="background-color: #0A2540; padding: 30px; text-align: center; color: #94a3b8; font-size: 12px;">
    <p style="margin: 0 0 10px 0; color: #ffffff; font-weight: 600;">Naina Tour & Travels</p>
    <p style="margin: 0 0 20px 0; line-height: 1.5;">Shop No. 12, Sector 27, Gurugram, Haryana 122002<br/>info@nainatravels.com | +91 70489 20649</p>
    <div style="border-top: 1px solid #1e293b; padding-top: 20px;">
      &copy; 2026 Naina Tour & Travels. All rights reserved.
    </div>
  </div>
</div>`
  },
  {
    id: 'welcome',
    name: 'Welcome Email',
    icon: FileText,
    subject: 'Welcome to FleetOps Taxi Services!',
    body: `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f1f5f9; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b;">
  <div style="background: linear-gradient(to right, #0ea5e9, #6366f1); padding: 40px 20px; text-align: center;">
    <h1 style="margin: 0; font-size: 28px; font-weight: 800;">FleetOps</h1>
  </div>
  <div style="padding: 40px 30px;">
    <h2 style="color: #f8fafc; margin-top: 0;">Welcome aboard!</h2>
    <p style="line-height: 1.6; color: #94a3b8;">We're thrilled to have you with us. Whether you're commuting to work or heading out for a night in the city, FleetOps is here to provide you with the most reliable and premium taxi experience.</p>
    <div style="margin: 30px 0; padding: 20px; background-color: #1e293b; border-radius: 12px; border: 1px solid #334155;">
      <p style="margin: 0; font-size: 14px; color: #38bdf8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Your First Ride</p>
      <p style="margin: 10px 0 0 0; color: #f1f5f9;">Use code <strong style="color: #6366f1;">FIRSTFLIGHT</strong> for 20% off your next trip!</p>
    </div>
    <a href="https://api.whatsapp.com/send?phone=917048920649&text=Hello%20Naina%20Travels%2C%20I%20want%20to%20book%20a%20cab&hl=en&lang=en" style="display: inline-block; background-color: #0ea5e9; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 10px;">Book a Ride Now</a>
  </div>
  <div style="padding: 20px; text-align: center; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b;">
    &copy; 2026 FleetOps Management. All rights reserved.
  </div>
</div>`
  },
  {
    id: 'summary',
    name: 'Trip Summary',
    icon: Layout,
    subject: 'Your Trip Summary — FleetOps',
    body: `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; color: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
  <div style="padding: 30px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
    <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #0ea5e9;">FleetOps</h1>
    <span style="font-size: 12px; color: #64748b;">Receipt #TRP-9402</span>
  </div>
  <div style="padding: 30px;">
    <h2 style="margin-top: 0; font-size: 24px;">₹450.00</h2>
    <p style="color: #64748b; font-size: 14px; margin-bottom: 30px;">May 15, 2026 • 8:30 PM</p>
    
    <div style="margin-bottom: 30px;">
      <div style="display: flex; margin-bottom: 15px;">
        <div style="width: 10px; height: 10px; border-radius: 50%; background-color: #10b981; margin-top: 5px; margin-right: 15px;"></div>
        <div>
          <p style="margin: 0; font-size: 12px; color: #64748b;">Pickup</p>
          <p style="margin: 2px 0 0 0; font-weight: 500;">Grand Central Station</p>
        </div>
      </div>
      <div style="display: flex;">
        <div style="width: 10px; height: 10px; border-radius: 50%; background-color: #0ea5e9; margin-top: 5px; margin-right: 15px;"></div>
        <div>
          <p style="margin: 0; font-size: 12px; color: #64748b;">Dropoff</p>
          <p style="margin: 2px 0 0 0; font-weight: 500;">Skyline Heights, Sector 45</p>
        </div>
      </div>
    </div>

    <div style="border-top: 1px dashed #e2e8f0; padding-top: 20px;">
      <p style="font-size: 14px; color: #64748b;">Your driver, <strong>Rahul S.</strong>, gave you a smooth ride in a Toyota Camry (MH12 AB 1234).</p>
    </div>
  </div>
  <div style="background-color: #f8fafc; padding: 30px; text-align: center;">
    <p style="margin: 0 0 15px 0; font-size: 14px; font-weight: 600;">How was your trip?</p>
    <div style="font-size: 24px;">⭐⭐⭐⭐⭐</div>
  </div>
</div>`
  }
];
