-- Fix function search paths for security
ALTER FUNCTION create_portal_user_from_contact(UUID, TEXT, TEXT, UUID) SET search_path = public;
ALTER FUNCTION authenticate_portal_user(TEXT, TEXT, UUID) SET search_path = public;
ALTER FUNCTION parse_canned_response(TEXT, UUID, UUID) SET search_path = public;