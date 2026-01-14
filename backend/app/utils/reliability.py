"""
Utility functions for reliability and rate limiting
"""
import asyncio
import functools
import time
from typing import Callable, Any
from collections import defaultdict

# ============================================
# RETRY DECORATOR
# ============================================
def retry_async(max_attempts: int = 3, delay: float = 1.0, backoff: float = 2.0):
    """
    Decorator for retrying async functions on failure.
    
    Args:
        max_attempts: Maximum number of retry attempts
        delay: Initial delay between retries (seconds)
        backoff: Multiplier for delay after each retry
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            last_exception = None
            current_delay = delay
            
            for attempt in range(1, max_attempts + 1):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt < max_attempts:
                        print(f"[Retry] {func.__name__} failed (attempt {attempt}/{max_attempts}): {e}")
                        await asyncio.sleep(current_delay)
                        current_delay *= backoff
                    else:
                        print(f"[Retry] {func.__name__} failed after {max_attempts} attempts")
            
            raise last_exception
        return wrapper
    return decorator


# ============================================
# RATE LIMITER
# ============================================
class RateLimiter:
    """
    Simple in-memory rate limiter.
    
    Usage:
        limiter = RateLimiter(max_requests=100, window_seconds=60)
        if limiter.is_allowed(user_id):
            # proceed
        else:
            # reject with 429
    """
    
    def __init__(self, max_requests: int = 100, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)  # user_id -> list of timestamps
    
    def is_allowed(self, user_id: str) -> bool:
        """Check if user is within rate limit"""
        now = time.time()
        user_requests = self.requests[user_id]
        
        # Remove old requests outside the window
        self.requests[user_id] = [
            ts for ts in user_requests 
            if now - ts < self.window_seconds
        ]
        
        if len(self.requests[user_id]) >= self.max_requests:
            return False
        
        self.requests[user_id].append(now)
        return True
    
    def get_remaining(self, user_id: str) -> int:
        """Get remaining requests for user"""
        now = time.time()
        user_requests = [
            ts for ts in self.requests[user_id]
            if now - ts < self.window_seconds
        ]
        return max(0, self.max_requests - len(user_requests))


# Global rate limiter instance (100 messages per minute per user)
message_rate_limiter = RateLimiter(max_requests=100, window_seconds=60)
