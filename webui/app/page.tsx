import { MyAppBar, SearchBar } from "@/components";
import { Container, Box, Typography } from "@mui/material";

export default function Home() {
  return (
    <>
      <title>OUI Lookup</title>
      <MyAppBar />
      <main
        className="flex flex-col items-center justify-center"
        style={{ minHeight: 'calc(100svh - 100px)' }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              sx={{ fontWeight: 'bold', fontSize: { xs: '2.125rem', sm: '3.75rem' } }}
            >
              OUI Lookup
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Search MAC Address or Manufacturer Information
            </Typography>
          </Box>

          <SearchBar initialQuery="" />
        </Container>
      </main>
    </>
  );
}