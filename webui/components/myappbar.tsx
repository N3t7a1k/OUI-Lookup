"use client"

import { AppBar, Box, Toolbar, Typography } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import logo from '../public/favicon.svg'
import Image from 'next/image';
import Link from "next/link";
import { useState, useEffect } from "react";

export default function MyAppBar() {
  const [dbUpdated, setDbUpdated] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => {
        if (data.updated_at) {
          setDbUpdated(new Date(data.updated_at + 'Z').toLocaleString());
        }
      })
      .catch(() => {});
  }, []);

  return (
    <AppBar position="sticky">
      <Toolbar style={{ height: 60 }}>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Image
              src={logo}
              width={50}
              height={50}
              alt="Logo"
            />
            <Typography
              variant="h6"
              component="span"
              sx={{ ml: 2, color: 'white', fontWeight: 'bold' }}
            >
              OUI Lookup
            </Typography>
          </Link>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {dbUpdated && (
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              DB: {dbUpdated}
            </Typography>
          )}
          <a
            href="https://github.com/N3t7a1k/OUI-Lookup"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center' }}
          >
            <GitHubIcon fontSize="small" />
          </a>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
