import { MetadataRoute } from 'next'

const SITE_URL = process.env.SITE_URL ?? 'https://oui.nettalk.io'

const popularVendors = [
  // Network Equipment
  'Cisco', 'Juniper', 'Aruba', 'Ubiquiti', 'Netgear',
  'TP-Link', 'D-Link', 'Linksys', 'Zyxel', 'MikroTik',
  'Fortinet', 'Palo Alto', 'F5',

  // Consumer Electronics
  'Apple', 'Samsung', 'Sony', 'LG', 'Panasonic',
  'Nintendo', 'Microsoft', 'Google', 'Amazon', 'Xiaomi',
  'Huawei', 'ASUS', 'Lenovo', 'Dell', 'HP',

  // Chipsets / Semiconductors
  'Intel', 'Broadcom', 'Qualcomm', 'Realtek', 'MediaTek',
  'Marvell',

  // Others
  'Raspberry Pi', 'VMware', 'Motorola', 'Nokia', 'Ericsson',
  'Bosch', 'Texas Instruments', 'Murata',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const vendorPages = popularVendors.map((vendor) => ({
    url: `${SITE_URL}/${encodeURIComponent(vendor)}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 1,
    },
    ...vendorPages,
  ]
}
