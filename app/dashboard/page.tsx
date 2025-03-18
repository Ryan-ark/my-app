'use client';

import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

interface UserPreferences {
  favorite_genres?: string[];
  notification_settings?: {
    email?: boolean;
    push?: boolean;
  };
}

interface User {
  id: string;
  email: string;
  name: string;
  preferences?: UserPreferences;
}

interface Movie {
  id: string;
  title: string;
  plot: string | null;
  genres: string[];
  year: number | string;
  rated: string | null;
  runtime: number | null;
  num_mflix_comments: number;
}

interface Theater {
  id: string;
  theaterId: number;
  location: {
    address: {
      city: string;
      state: string;
      street1: string;
      zipcode: string;
    };
  };
}

interface Comment {
  id: string;
  name: string;
  email: string;
  movie_id: string;
  text: string;
  date: string;
}

export default function Dashboard(): ReactElement {
  const [users, setUsers] = useState<User[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersResponse, moviesResponse, theatersResponse, commentsResponse] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/movies'),
          fetch('/api/theaters'),
          fetch('/api/comments')
        ]);
        
        const usersData = await usersResponse.json();
        const moviesData = await moviesResponse.json();
        const theatersData = await theatersResponse.json();
        const commentsData = await commentsResponse.json();
        
        setUsers(usersData);
        setMovies(moviesData);
        setTheaters(theatersData);
        setComments(commentsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Overview</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Movies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{movies.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Theaters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{theaters.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{comments.length}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Movies</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Genre</TableHead>
                      <TableHead>Comments</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movies.slice(0, 5).map((movie) => (
                      <TableRow key={movie.id}>
                        <TableCell className="font-medium">{movie.title}</TableCell>
                        <TableCell>{movie.year}</TableCell>
                        <TableCell>{movie.genres.slice(0, 2).join(', ')}</TableCell>
                        <TableCell>{movie.num_mflix_comments}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Comment</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comments.slice(0, 5).map((comment) => (
                      <TableRow key={comment.id}>
                        <TableCell>{comment.name}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{comment.text}</TableCell>
                        <TableCell>{new Date(comment.date).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Theaters</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Theater ID</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>State</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {theaters.slice(0, 5).map((theater) => (
                      <TableRow key={theater.id}>
                        <TableCell>{theater.theaterId}</TableCell>
                        <TableCell>{theater.location.address.city}</TableCell>
                        <TableCell>{theater.location.address.state}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.slice(0, 5).map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
