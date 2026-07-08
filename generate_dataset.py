import json
import random
from datetime import datetime, timedelta

def generate_drafts(count=1200):
    types = ['social', 'article', 'caption']
    statuses = ['Draft', 'In Review', 'Approved', 'Published']
    authors = [
        'Sarah Jenkins', 'Alex Rivera', 'Elena Rostova', 'David Chen', 
        'Marcus Johnson', 'Amira Patel', 'Lucas Bianchi', 'Chloe Dupont'
    ]
    
    tags_pool = [
        'marketing', 'tech', 'tutorial', 'announcement', 'culture', 
        'news', 'design', 'development', 'product', 'growth',
        'community', 'hiring', 'qa', 'security', 'agile',
        'socialmedia', 'branding', 'case-study', 'tips', 'event'
    ]

    titles_by_type = {
        'social': [
            "Excited to announce our new update!", "5 tips for better remote collaboration",
            "Why we are moving to SQLite", "Celebrating our 5th anniversary today!",
            "Sneak peek at our upcoming UI redesign", "How we reduced page load times by 40%",
            "We are hiring a Senior Fullstack Engineer!", "Join our community AMA session next Tuesday"
        ],
        'article': [
            "The Rise of Keyset Pagination in Modern Web APIs",
            "Understanding Concurrency in File-based Databases",
            "Building Robust Web Applications under Time Constraints",
            "A Deep Dive into SQLite Optimistic Locking Mechanisms",
            "Designing Clean React State Machines for Document Editors",
            "Why Client-side Rollback is Critical for Collaborative Tools",
            "The Evolution of Single-page Application Deployment Strategies",
            "Zod vs Hand-written Validations: Performance and Type-Safety"
        ],
        'caption': [
            "Coffee, code, and collaboration.", "Behind the scenes of our latest release.",
            "Work hard, dream big, edit concurrently.", "Less is more. Simplicity in design.",
            "Building the future of draft management.", "Teamwork makes the dream work!",
            "Monday motivation: debug and deploy.", "Simplicity is the ultimate sophistication."
        ]
    }

    bodies_by_type = {
        'social': (
            "We are super excited to share our latest release with you! Over the past few weeks, "
            "our team has been working around the clock to improve performance and stability. "
            "Check out the full list of changes on our blog. What feature are you most excited about? "
            "Let us know in the comments below!"
        ),
        'article': (
            "Pagination is a core aspect of API design, yet it is often implemented inefficiently. "
            "Offset pagination using LIMIT and OFFSET is simple but suffers from performance degradation "
            "and duplication bugs during concurrent updates. Keyset pagination solves this by filtering "
            "on a unique, ordered cursor (like an ID or timestamp), ensuring stable performance and correctness. "
            "In this article, we examine how cursor-based queries function under heavy write loads."
        ),
        'caption': (
            "Another day, another sprint successfully completed! Grateful for a team that prioritizes "
            "quality and communication. Ready to tackle next week's challenges! #development #teamwork"
        )
    }

    drafts = []
    base_time = datetime(2026, 6, 1)

    for i in range(1, count + 1):
        dtype = random.choice(types)
        status = random.choice(statuses)
        author = random.choice(authors)
        
        # Pick specific titles or fallback
        possible_titles = titles_by_type[dtype]
        title = random.choice(possible_titles) + f" (Part {random.randint(1, 10)})" if random.random() > 0.5 else random.choice(possible_titles)
        title = f"{title} #{i}"
        
        # Generate some tags
        num_tags = random.randint(1, 4)
        tags = random.sample(tags_pool, num_tags)
        
        # Timestamps
        days_offset = random.randint(0, 30)
        minutes_offset = random.randint(0, 1440)
        created_dt = base_time + timedelta(days=days_offset, minutes=minutes_offset)
        updated_dt = created_dt + timedelta(hours=random.randint(1, 24))
        
        drafts.append({
            "id": i,
            "title": title[:200],
            "type": dtype,
            "body": bodies_by_type[dtype],
            "tags": tags,
            "author": author,
            "status": status,
            "version": 1,
            "createdAt": created_dt.isoformat() + "Z",
            "updatedAt": updated_dt.isoformat() + "Z"
        })
        
    return drafts

if __name__ == "__main__":
    import os
    os.makedirs("data", exist_ok=True)
    dataset = generate_drafts(1200)
    with open("data/seed_drafts.json", "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2, ensure_ascii=False)
    print(f"Successfully generated {len(dataset)} drafts and saved to data/seed_drafts.json")
