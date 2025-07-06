import requests
from bs4 import BeautifulSoup
import re
import statistics
import os
from langchain_openai import ChatOpenAI
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate


def analyze_url_content(url):
    """
    Fetches and analyzes content from a URL to extract structural and stylistic elements.
    """
    try:
        response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        # Title
        title = soup.title.string.strip() if soup.title and soup.title.string else ""
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            title = og_title["content"].strip()

        # Author
        author = ""
        meta_author = soup.find("meta", attrs={"name": "author"})
        if meta_author and meta_author.get("content"):
            author = meta_author["content"].strip()
        byline = soup.find(class_=re.compile("byline|author", re.I))
        if byline:
            author = byline.get_text(strip=True)

        # Publication date
        pub_date = ""
        meta_date = soup.find("meta", property="article:published_time")
        if meta_date and meta_date.get("content"):
            pub_date = meta_date["content"].strip()
        time_tag = soup.find("time")
        if time_tag and time_tag.get("datetime"):
            pub_date = time_tag["datetime"].strip()

        # Meta description
        description = ""
        meta_desc = soup.find("meta", attrs={"name": "description"})
        if meta_desc and meta_desc.get("content"):
            description = meta_desc["content"].strip()
        og_desc = soup.find("meta", property="og:description")
        if og_desc and og_desc.get("content"):
            description = og_desc["content"].strip()

        # Find the main content area if possible
        main_content = soup.select_one(
            "main, article, .content, #content, .post, .article, .entry-content"
        )
        if not main_content:
            main_content = soup  # Use full body if no main content area identified

        # Main image (og:image or first image in main content)
        main_image = ""
        og_image = soup.find("meta", property="og:image")
        if og_image and og_image.get("content"):
            main_image = og_image["content"].strip()
        else:
            main_content = soup.select_one(
                "main, article, .content, #content, .post, .article, .entry-content"
            )
            if main_content:
                first_img = main_content.find("img")
                if first_img and first_img.get("src"):
                    main_image = first_img["src"]

        # All images in main content
        all_images = []
        if main_content:
            for img in main_content.find_all("img"):
                if img.get("src"):
                    all_images.append(img["src"])

        # Remove non-content areas
        for element in soup.select(
            "nav, footer, header, aside, .sidebar, .menu, .navigation, .footer, .comments, .widget"
        ):
            element.decompose()

        # Get all headings to exclude them from paragraph count
        headings = []
        for i in range(1, 7):
            if main_content:
                headings.extend(
                    [h.get_text().strip() for h in main_content.find_all(f"h{i}")]
                )

        # Get all table headers and cells
        table_elements = []
        if main_content:
            for cell in main_content.select("th, td, caption"):
                table_elements.append(cell.get_text().strip())

        # Get buttons, labels, and other UI elements
        ui_elements = []
        if main_content:
            for el in main_content.select("button, label, input, select, textarea"):
                ui_elements.append(el.get_text().strip())

        # Get paragraph elements
        paragraphs = main_content.find_all("p") if main_content else []

        # Filter paragraphs much more strictly
        substantive_paragraphs = []
        for p in paragraphs:
            # Skip if it has display:none or visibility:hidden
            style = p.get("style", "")
            if "display:none" in style or "visibility:hidden" in style:
                continue

            # Get text and skip if empty
            text = p.get_text().strip()
            if not text:
                continue

            # Skip if this is inside a non-content container
            if p.parent and p.parent.get("class"):
                parent_classes = " ".join(p.parent.get("class")).lower()
                if any(
                    term in parent_classes
                    for term in [
                        "comment",
                        "widget",
                        "sidebar",
                        "footer",
                        "menu",
                        "nav",
                        "author",
                        "meta",
                    ]
                ):
                    continue

            # Skip if it's a heading, table element or UI element
            if text in headings or text in table_elements or text in ui_elements:
                continue

            # Skip very short texts that don't look like real paragraphs
            if len(text) < 80:  # Increased from 50 to be more strict
                # Skip single sentences or phrases that are probably not full paragraphs
                if len(text.split()) < 15 and (
                    not text.endswith(".")
                    and not text.endswith("!")
                    and not text.endswith("?")
                ):
                    continue

                # Skip if it looks like a heading
                if text.isupper() or (
                    text[0].isupper() and not any(c in text for c in [".", ",", ";"])
                ):
                    continue

                # Skip if it's a list item or bullet point
                if (
                    text.startswith("-")
                    or text.startswith("•")
                    or text.startswith("*")
                    or re.match(r"^\d+\.", text)
                ):
                    continue

                # Skip if it contains special characters typical of UI elements
                if any(char in text for char in ["→", "⟶", "▶", "»", "☰", "✓"]):
                    continue

            # Skip if it's a table cell or likely UI element
            if p.parent and p.parent.name in ["td", "th", "li", "button", "label", "a"]:
                continue

            # Skip if it has certain classes that suggest it's not a content paragraph
            if p.get("class"):
                p_classes = " ".join(p.get("class")).lower()
                if any(
                    term in p_classes
                    for term in [
                        "meta",
                        "info",
                        "date",
                        "author",
                        "tag",
                        "button",
                        "caption",
                    ]
                ):
                    continue

            # Skip if it looks like a signature, date, or attribution
            if re.search(
                r"©|\bcopyright\b|\ball rights reserved\b|\bposted on\b|\bby\b.*\bon\b.*\d{4}",
                text.lower(),
            ):
                continue

            substantive_paragraphs.append(p)

        # Extract paragraph text from the filtered paragraphs
        paragraph_texts = [p.get_text().strip() for p in substantive_paragraphs]
        

        # Additional filtering after extraction
        filtered_paragraphs = []
        for text in paragraph_texts:
            # Skip likely headers or very short paragraphs again
            if (
                len(text) < 100
                and len(text.split()) < 20
                and not re.search(r"[.!?].*[.!?]", text)
            ):
                continue

            # Skip anything that looks like a list item (might have been missed in HTML)
            if re.match(r"^[•\-*]|\d+\.\s", text):
                continue

            filtered_paragraphs.append(text)

        # Calculate paragraph statistics
        paragraph_count = len(filtered_paragraphs)

        if paragraph_count == 0:
            return {
                "success": False,
                "error": "No substantive paragraphs found on page",
            }

        # Get a few sample paragraphs (excluding very short ones)
        sample_paragraphs = [p for p in filtered_paragraphs if len(p.split()) > 15][:3]

        # Calculate sentences per paragraph
        sentences_per_paragraph = []
        words_per_paragraph = []

        for p in filtered_paragraphs:
            # Rough sentence splitting
            sentences = re.split(r"[.!?]+", p)
            sentences = [s.strip() for s in sentences if s.strip()]
            sentences_per_paragraph.append(len(sentences))

            # Word count
            words = p.split()
            words_per_paragraph.append(len(words))

        # Get headings
        headings = []
        for i in range(1, 7):
            headings.extend(main_content.find_all(f"h{i}"))

        # Get lists
        lists = main_content.find_all(["ul", "ol"]) if main_content else []

        # Calculate average word length
        all_words = []
        for p in filtered_paragraphs:
            all_words.extend(p.split())

        avg_word_length = 0
        if all_words:
            avg_word_length = sum(len(word) for word in all_words) / len(all_words)

        # Analyze tone (very basic)
        tone_indicators = []

        # Check for formal language
        formal_indicators = [
            "therefore",
            "consequently",
            "furthermore",
            "moreover",
            "thus",
        ]
        if any(
            word.lower() in " ".join(filtered_paragraphs).lower()
            for word in formal_indicators
        ):
            tone_indicators.append("formal")

        # Check for casual language
        casual_indicators = [
            "don't",
            "won't",
            "can't",
            "let's",
            "awesome",
            "cool",
            "great",
        ]
        if any(
            word.lower() in " ".join(filtered_paragraphs).lower()
            for word in casual_indicators
        ):
            tone_indicators.append("casual")

        # Check for technical language
        if avg_word_length > 6:
            tone_indicators.append("technical")

        # Check for conversational style
        if "?" in " ".join(filtered_paragraphs) or "!" in " ".join(filtered_paragraphs):
            tone_indicators.append("conversational")

        # Default tone if none detected
        if not tone_indicators:
            tone_indicators.append("neutral")

        return {
            "success": True,
            "paragraph_stats": {
                "count": paragraph_count,
                "avg_sentences": (
                    round(statistics.mean(sentences_per_paragraph), 1)
                    if sentences_per_paragraph
                    else 0
                ),
                "avg_words": (
                    round(statistics.mean(words_per_paragraph), 1)
                    if words_per_paragraph
                    else 0
                ),
            },
            "structure": {"sections": len(headings), "lists": len(lists)},
            "content_stats": {"avg_word_length": round(avg_word_length, 1)},
            "tone_indicators": tone_indicators,
            "sample_paragraphs": sample_paragraphs,
            "title": title,
            "author": author,
            "pub_date": pub_date,
            "description": description,
            "main_image": main_image,
            "all_images": all_images,
        }

    except Exception as e:
        return {"success": False, "error": str(e)}
    
def create_agent():
    openai_api_key = os.getenv("OPENAI_API_KEY")
    llm = ChatOpenAI(
        model="gpt-3.5-turbo", 
        api_key=openai_api_key,
        temperature=0.7
    )

    # Step 1: Summarize blog content as a tweet (human, technical background)
    summarize_prompt = PromptTemplate(
        input_variables=["content"],
        template=(
            "You are a developer with a strong technical background. "
            "Given the following blog analysis and content, write an engaging tweet that provides real value. "
            "If the content is complex or detailed, don't be afraid to exceed 280 characters to create a comprehensive, "
            "informative tweet that truly helps the reader. Focus on substance over brevity when the content warrants it. "
            "Write like a real human, not a bot. Use clear, concise, and technical language where appropriate.\n"
            "BLOG ANALYSIS AND CONTEXT:\n{content}"
        )
    )
    summarize_chain = LLMChain(llm=llm, prompt=summarize_prompt)

    # Step 2: Review and improve the tweet
    review_prompt = PromptTemplate(
        input_variables=["tweet"],
        template=(
            "You are a technical editor. Review and improve this tweet for clarity, engagement, and technical accuracy. "
            "If the tweet exceeds 280 characters but provides substantial value, keep it comprehensive. "
            "The goal is to create useful content, not just fit arbitrary character limits. "
            "Ensure it sounds like a real human with a technical background wrote it.\n"
            "Tweet:\n{tweet}"
        )
    )
    review_chain = LLMChain(llm=llm, prompt=review_prompt)

    # Step 3: Reach enhancer (add hashtags, maximize engagement)
    reach_prompt = PromptTemplate(
        input_variables=["tweet"],
        template=(
            "You are a social media expert. Enhance the following tweet to maximize its reach and engagement. "
            "Add relevant and trending hashtags (max 3-4). If the tweet is longer than 280 characters, "
            "that's fine if it provides substantial value. Focus on creating useful, informative content.\n"
            "Tweet:\n{tweet}"
        )
    )
    reach_chain = LLMChain(llm=llm, prompt=reach_prompt)

    class Agent:
        def generate_tweet(self, paragraphs, tone, stats, structure, content_stats, additional_text=""):
            content = "\n\n".join(paragraphs)
            context = (
                f"Tone: {tone}\n"
                f"Paragraph stats: {stats}\n"
                f"Structure: {structure}\n"
                f"Content stats: {content_stats}\n"
            )
            
            # Add additional text to context if provided
            if additional_text:
                context += f"\nAdditional Instructions: {additional_text}\n"
            
            tweet = summarize_chain.run(content=f"{context}\n{content}")
            reviewed_tweet = review_chain.run(tweet=tweet)
            enhanced_tweet = reach_chain.run(tweet=reviewed_tweet)
            return enhanced_tweet.strip()

    return Agent()

def split_into_thread(tweet_text, max_length=280):
    """
    Split a long tweet into a thread of smaller tweets.
    """
    if len(tweet_text) <= max_length:
        return [tweet_text]
    
    # Split by sentences first
    sentences = tweet_text.split('. ')
    threads = []
    current_thread = ""
    thread_number = 1
    total_threads = max(2, len(tweet_text) // (max_length - 20))  # Estimate total threads
    
    for sentence in sentences:
        # Add thread number prefix for subsequent tweets
        prefix = f"{thread_number}/{total_threads} " if thread_number > 1 else ""
        potential_tweet = prefix + current_thread + sentence + ". "
        
        if len(potential_tweet) > max_length and current_thread:
            # Add thread number to the current tweet if it's not the first
            final_tweet = f"{thread_number}/{total_threads} {current_thread.strip()}" if thread_number > 1 else current_thread.strip()
            threads.append(final_tweet)
            current_thread = sentence + ". "
            thread_number += 1
        else:
            current_thread += sentence + ". "
    
    # Add the last tweet
    if current_thread.strip():
        final_tweet = f"{thread_number}/{total_threads} {current_thread.strip()}" if thread_number > 1 else current_thread.strip()
        threads.append(final_tweet)
    
    return threads

def tweet_from_url(url, additional_text=""):
    analysis = analyze_url_content(url)
    if not analysis["success"]:
        return None

    sample_paragraphs = analysis["sample_paragraphs"]
    if not sample_paragraphs:
        return None

    # Gather extra context for the agent
    tone = ", ".join(analysis.get("tone_indicators", []))
    stats = analysis.get("paragraph_stats", {})
    structure = analysis.get("structure", {})
    content_stats = analysis.get("content_stats", {})

    agent = create_agent()
    tweet = agent.generate_tweet(
        sample_paragraphs,
        tone=tone,
        stats=stats,
        structure=structure,
        content_stats=content_stats,
        additional_text=additional_text
    )
    
    # Split into thread if too long
    thread_tweets = split_into_thread(tweet.strip())
    
    analysis["tweet"] = tweet.strip()
    analysis["thread_tweets"] = thread_tweets
    analysis["is_thread"] = len(thread_tweets) > 1
    
    return analysis