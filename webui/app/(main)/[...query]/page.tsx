"use client";

import { useState, useEffect, use } from 'react';
import { MyAppBar, SearchBar } from "@/components";
import {
  List, ListItem, ListItemText, Pagination, Skeleton, Alert, Box,
  Container, Stack, Typography, Link, useMediaQuery
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useRouter, useSearchParams } from 'next/navigation';
import { styled } from '@mui/material';

interface PageProps {
  params: Promise<{
    query: string[];
  }>;
}

interface OUIItem {
  Registry?: string;
  Assignment: string;
  "Organization Name": string;
  "Organization Address"?: string;
}

interface ApiResponse {
  meta: {
    total: number;
    page: number;
    limit: number;
    type: string;
  };
  data: OUIItem[];
}

const StyledLink = styled(Link)(({ theme }) => ({
  color: theme.palette.text.primary,
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
  },
}));

function formatMAC(assignment: string): string {
  if (!assignment) return '';
  const cleanMac = assignment.toUpperCase().replace(/[^0-9A-F]/g, '');
  const paddedMac = cleanMac.padEnd(12, '0');
  return paddedMac.match(/.{1,2}/g)?.join(':') || paddedMac;
}

export default function QueryPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const initialQuery = decodeURIComponent(resolvedParams.query[0]);

  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentPage = Number(searchParams.get('page')) || 1;
  const itemsPerPage = 10;
  const isMobile = useMediaQuery("(max-width: 767px)");

  const ListItemTextPrimary = styled('span')(({ theme }) => ({
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'inline-block',
    maxWidth: isMobile ? '100%' : 'calc(100% - 100px)',
    fontWeight: 500,
    color: theme.palette.text.primary,
  }));

  const ListItemTextSecondary = styled('span')(({ theme }) => ({
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'inline-block',
    maxWidth: isMobile ? '100%' : 'calc(100% - 100px)',
    color: theme.palette.text.secondary,
  }));



  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const apiUrl = `/api/search?query=${encodeURIComponent(initialQuery)}&page=${currentPage}&limit=${itemsPerPage}`;

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred');
        }
      }
      setLoading(false);
      document.title = `OUILookup - "${initialQuery}"`;
    };

    fetchData();
  }, [initialQuery, currentPage]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    router.push(`/${initialQuery}?page=${page}`);
  };

  return (
    <>
      <MyAppBar />
      <Container
        maxWidth="lg"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'calc(100vh - 150px)',
          py: 4,
          alignItems: 'center',
        }}
      >
        <SearchBar initialQuery={initialQuery} />

        <Box sx={{ flexGrow: 1, width: '100%' }}>
          {loading ? (
            <Stack spacing={2}>
              {Array.from(new Array(10)).map((_, index) => (
                <Skeleton key={index} variant="rounded" width="100%" height={50} />
              ))}
            </Stack>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : data && data.meta && data.meta.total > 0 ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'right' }}>
                Found {data.meta.total} results
              </Typography>

              <List sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 1 }}>
                {data.data.map((item, index) => (
                  <ListItem key={index} divider={index < data.data.length - 1}>
                    <ListItemText
                      primary={
                        <ListItemTextPrimary>
                          {item["Organization Name"]}
                        </ListItemTextPrimary>
                      }
                      secondary={
                        isMobile ? (
                          <ListItemTextSecondary>
                            {formatMAC(item["Assignment"])}
                          </ListItemTextSecondary>
                        ) : (
                          <ListItemTextSecondary>
                            <StyledLink
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item["Organization Address"] || "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {item["Organization Address"]}
                            </StyledLink>
                          </ListItemTextSecondary>
                        )
                      }
                    />
                    {(!isMobile) && (
                      <Box ml="auto">
                        <Typography variant="body2">
                          {formatMAC(item["Assignment"])}
                        </Typography>
                      </Box>
                    )}
                  </ListItem>
                ))}
              </List>

              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={Math.ceil(data.meta.total / itemsPerPage)}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  size={isMobile ? "small" : "large"}
                  showFirstButton
                  showLastButton
                />
              </Box>
            </>
          ) : (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '200px',
                flexDirection: 'column',
                opacity: 0.7
              }}
            >
              <SearchIcon sx={{ fontSize: 60, mb: 2, color: 'text.secondary' }} />
              <Typography variant="h6" color="text.secondary">
                No results found for "{initialQuery}"
              </Typography>
            </Box>
          )}
        </Box>
      </Container>
    </>
  );
}
