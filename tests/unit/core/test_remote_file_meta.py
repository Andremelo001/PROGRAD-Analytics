from app.core.domain.value_objects.remote_file_meta import RemoteFileMeta


def test_matches_by_etag_when_both_have_one():
    a = RemoteFileMeta(etag='"abc"', last_modified="X", content_length=1)
    b = RemoteFileMeta(etag='"abc"', last_modified="Y", content_length=2)
    assert a.matches(b)

    c = RemoteFileMeta(etag='"different"', last_modified="X", content_length=1)
    assert not a.matches(c)


def test_falls_back_to_last_modified_and_length_without_etag():
    a = RemoteFileMeta(etag=None, last_modified="Wed, 01 Jan 2025", content_length=100)
    b = RemoteFileMeta(etag=None, last_modified="Wed, 01 Jan 2025", content_length=100)
    assert a.matches(b)

    c = RemoteFileMeta(etag=None, last_modified="Thu, 02 Jan 2025", content_length=100)
    assert not a.matches(c)
