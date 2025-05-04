import { supabase } from '@/lib/supabase';

export interface AgencyClient {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  websites: AgencyClientWebsite[];
}

export interface AgencyClientWebsite {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  createdAt: string;
  lastScanId?: string;
  lastScanDate?: string;
}

export interface ClientInvitation {
  id: string;
  email: string;
  token: string;
  agencyId: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: string;
  expiresAt: string;
}

/**
 * Check if a user is an agency
 * @param userId The user ID
 * @returns Whether the user is an agency
 */
export async function isAgency(userId: string): Promise<boolean> {
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('plan_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error) {
    console.error('Error checking if user is an agency:', error);
    return false;
  }

  return subscription?.plan_id === 'agency';
}

/**
 * Get clients for an agency
 * @param agencyId The agency user ID
 * @returns Array of agency clients
 */
export async function getAgencyClients(agencyId: string): Promise<AgencyClient[]> {
  const { data: clientRelations, error: relationsError } = await supabase
    .from('agency_clients')
    .select('client_id')
    .eq('agency_id', agencyId);

  if (relationsError) {
    console.error('Error fetching agency clients:', relationsError);
    return [];
  }

  if (clientRelations.length === 0) {
    return [];
  }

  const clientIds = clientRelations.map(relation => relation.client_id);

  const { data: clients, error: clientsError } = await supabase
    .from('users')
    .select('id, name, email, created_at')
    .in('id', clientIds);

  if (clientsError) {
    console.error('Error fetching client details:', clientsError);
    return [];
  }

  const clientsWithWebsites: AgencyClient[] = [];

  for (const client of clients) {
    const { data: websites, error: websitesError } = await supabase
      .from('websites')
      .select(`
        id, 
        name, 
        url, 
        is_active, 
        created_at,
        scans(id, created_at, status)
      `)
      .eq('user_id', client.id)
      .order('created_at', { ascending: false });

    if (websitesError) {
      console.error(`Error fetching websites for client ${client.id}:`, websitesError);
      continue;
    }

    const formattedWebsites: AgencyClientWebsite[] = websites.map(website => {
      // Find the most recent completed scan
      const lastScan = website.scans
        ? website.scans
            .filter((scan: any) => scan.status === 'completed')
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        : null;

      return {
        id: website.id,
        name: website.name,
        url: website.url,
        isActive: website.is_active,
        createdAt: website.created_at,
        lastScanId: lastScan ? lastScan.id : undefined,
        lastScanDate: lastScan ? lastScan.created_at : undefined,
      };
    });

    clientsWithWebsites.push({
      id: client.id,
      name: client.name,
      email: client.email,
      createdAt: client.created_at,
      websites: formattedWebsites,
    });
  }

  return clientsWithWebsites;
}

/**
 * Invite a client to join the agency
 * @param agencyId The agency user ID
 * @param email The client's email
 * @param name The client's name (optional)
 * @returns The created invitation
 */
export async function inviteClient(
  agencyId: string,
  email: string,
  name?: string
): Promise<ClientInvitation | null> {
  try {
    // Check if the client already exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (!userError && existingUser) {
      // Check if the client is already associated with this agency
      const { data: existingRelation, error: relationError } = await supabase
        .from('agency_clients')
        .select('*')
        .eq('agency_id', agencyId)
        .eq('client_id', existingUser.id)
        .single();

      if (!relationError && existingRelation) {
        throw new Error('This client is already associated with your agency');
      }

      // If the user exists but is not associated with this agency, create the relation
      if (!relationError || (relationError && relationError.code === 'PGRST116')) {
        const { error: createRelationError } = await supabase
          .from('agency_clients')
          .insert({
            agency_id: agencyId,
            client_id: existingUser.id,
          });

        if (createRelationError) {
          throw new Error('Failed to associate client with agency');
        }

        // Return a "fake" invitation that's already accepted
        return {
          id: 'direct-association',
          email,
          token: '',
          agencyId,
          status: 'accepted',
          createdAt: new Date().toISOString(),
          expiresAt: new Date().toISOString(),
        };
      }
    }

    // Generate a unique token for the invitation
    const token = generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expire in 7 days

    // Create the invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('client_invitations')
      .insert({
        agency_id: agencyId,
        email,
        token,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        client_name: name,
      })
      .select('*')
      .single();

    if (invitationError) {
      throw new Error('Failed to create invitation');
    }

    // In a real implementation, you would send an email to the client with the invitation link
    console.log(`Invitation created for ${email} with token ${token}`);

    return {
      id: invitation.id,
      email: invitation.email,
      token: invitation.token,
      agencyId: invitation.agency_id,
      status: invitation.status,
      createdAt: invitation.created_at,
      expiresAt: invitation.expires_at,
    };
  } catch (error) {
    console.error('Error inviting client:', error);
    return null;
  }
}

/**
 * Get pending invitations for an agency
 * @param agencyId The agency user ID
 * @returns Array of pending invitations
 */
export async function getPendingInvitations(agencyId: string): Promise<ClientInvitation[]> {
  const { data, error } = await supabase
    .from('client_invitations')
    .select('*')
    .eq('agency_id', agencyId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending invitations:', error);
    return [];
  }

  return data.map(invitation => ({
    id: invitation.id,
    email: invitation.email,
    token: invitation.token,
    agencyId: invitation.agency_id,
    status: invitation.status,
    createdAt: invitation.created_at,
    expiresAt: invitation.expires_at,
  }));
}

/**
 * Cancel a client invitation
 * @param invitationId The invitation ID
 * @returns Whether the cancellation was successful
 */
export async function cancelInvitation(invitationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('client_invitations')
    .update({ status: 'expired' })
    .eq('id', invitationId);

  if (error) {
    console.error('Error cancelling invitation:', error);
    return false;
  }

  return true;
}

/**
 * Accept a client invitation
 * @param token The invitation token
 * @param userId The user ID accepting the invitation
 * @returns Whether the acceptance was successful
 */
export async function acceptInvitation(token: string, userId: string): Promise<boolean> {
  try {
    // Get the invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('client_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (invitationError || !invitation) {
      throw new Error('Invalid or expired invitation');
    }

    // Check if the invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      await supabase
        .from('client_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);
      
      throw new Error('Invitation has expired');
    }

    // Create the agency-client relationship
    const { error: relationError } = await supabase
      .from('agency_clients')
      .insert({
        agency_id: invitation.agency_id,
        client_id: userId,
      });

    if (relationError) {
      throw new Error('Failed to create agency-client relationship');
    }

    // Update the invitation status
    const { error: updateError } = await supabase
      .from('client_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);

    if (updateError) {
      throw new Error('Failed to update invitation status');
    }

    return true;
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return false;
  }
}

/**
 * Remove a client from an agency
 * @param agencyId The agency user ID
 * @param clientId The client user ID
 * @returns Whether the removal was successful
 */
export async function removeClient(agencyId: string, clientId: string): Promise<boolean> {
  const { error } = await supabase
    .from('agency_clients')
    .delete()
    .eq('agency_id', agencyId)
    .eq('client_id', clientId);

  if (error) {
    console.error('Error removing client:', error);
    return false;
  }

  return true;
}

/**
 * Get agencies for a client
 * @param clientId The client user ID
 * @returns Array of agency user IDs
 */
export async function getClientAgencies(clientId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('agency_clients')
    .select('agency_id')
    .eq('client_id', clientId);

  if (error) {
    console.error('Error fetching client agencies:', error);
    return [];
  }

  return data.map(relation => relation.agency_id);
}

/**
 * Generate a random invitation token
 * @returns A random token
 */
function generateInvitationToken(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}